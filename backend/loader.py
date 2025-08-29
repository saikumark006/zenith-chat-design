import os, re, pandas as pd, requests
from requests.adapters import HTTPAdapter
from snowflake.connector.pandas_tools import write_pandas
from urllib3.util.retry import Retry
import snowflake.connector
import traceback
import urllib.parse

# ---------- Snowflake Credentials ----------


def create_retry_session(retries=3, backoff_factor=0.5, status_forcelist=(500,502,503,504)):
    session = requests.Session()
    retry = Retry(total=retries, backoff_factor=backoff_factor, status_forcelist=status_forcelist, allowed_methods=frozenset(['GET']))
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

def sanitize_column(col: str) -> str:
    col = str(col).strip().strip('"').strip("'")
    col = re.sub(r'[^A-Za-z0-9_$]', '_', col)
    if col and not re.match(r'^[A-Za-z_]', col):
        col = "COL_" + col
    if not col:
        col = "UNNAMED_COL"
    return col.upper()

def test_snowflake_connection():
    """Test if Snowflake connection works"""
    try:
        conn = snowflake.connector.connect(
            user=sf_user, password=sf_password, account=sf_account,
            role=sf_role, warehouse=sf_warehouse,
            database=sf_database, schema=sf_schema,
        )
        cursor = conn.cursor()
        cursor.execute("SELECT CURRENT_VERSION()")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return True, f"Connection successful. Snowflake version: {result[0]}"
    except Exception as e:
        return False, f"Connection failed: {str(e)}"

def run_loader(api_list: list[str]):
    results = []
    
    # First test the connection
    conn_success, conn_msg = test_snowflake_connection()
    results.append(f"Connection test: {conn_msg}")
    
    if not conn_success:
        return results
    
    session = create_retry_session()
    conn = None
    
    try:
        # Connect to Snowflake
        conn = snowflake.connector.connect(
            user=sf_user, password=sf_password, account=sf_account,
            role=sf_role, warehouse=sf_warehouse,
            database=sf_database, schema=sf_schema,
        )
        results.append("Connected to Snowflake successfully")
        
        # Process each URL
        sources = {f"source_{i+1}": url for i, url in enumerate(api_list) if url.strip()}
        results.append(f"Processing {len(sources)} sources: {list(sources.keys())}")

        for i, (name, url) in enumerate(sources.items(), start=1):
            try:
                results.append(f"Processing {name}: {url}")
                
                # Load data based on file type
                if url.endswith(".csv"):
                    df = pd.read_csv(url)
                    results.append(f"Loaded CSV with shape: {df.shape}")
                elif url.endswith(".parquet"):
                    df = pd.read_parquet(url)
                    results.append(f"Loaded Parquet with shape: {df.shape}")
                else:
                    response = session.get(url, timeout=15)
                    response.raise_for_status()
                    data = response.json()
                    df = pd.DataFrame(data)
                    results.append(f"Loaded JSON API with shape: {df.shape}")

                if df.empty:
                    results.append(f"WARNING: {name} is empty, skipping")
                    continue

                # -------- Table name derived from URL --------
                parsed = urllib.parse.urlparse(url)
                filename = os.path.basename(parsed.path) or parsed.path
                table_name = filename.replace(".csv", "").replace(".parquet", "").replace("-", "_").upper()
                if not table_name:
                    table_name = parsed.path.strip("/").split("/")[-1].upper() or f"SOURCE_{i}"
                results.append(f"Target table name: {table_name}")
                
                # Show original columns
                original_columns = df.columns.tolist()
                results.append(f"Original columns ({len(original_columns)}): {original_columns}")
                
                # Sanitize columns
                df.columns = [sanitize_column(c) for c in df.columns]
                
                # Handle duplicate columns
                seen, final = {}, []
                for c in df.columns:
                    if c in seen:
                        seen[c] += 1
                        final.append(f"{c}_{seen[c]}")
                    else:
                        seen[c] = 0
                        final.append(c)
                df.columns = final
                results.append(f"Sanitized columns ({len(final)}): {final}")
                
                # Convert object columns to string and handle NaNs
                for c in df.select_dtypes(include=['object']).columns:
                    df[c] = df[c].astype(str)
                df = df.where(pd.notnull(df), None)
                
                results.append(f"Data types: {dict(df.dtypes)}")
                results.append(f"Sample data: {df.head(2).to_dict()}")

                # Write to Snowflake
                results.append(f"Writing {len(df)} rows to Snowflake table {table_name}")
                
                success, nchunks, nrows, _ = write_pandas(
                    conn, df, table_name,
                    overwrite=True, 
                    auto_create_table=True, 
                    quote_identifiers=False
                )
                
                if success:
                    results.append(f"SUCCESS: Loaded {nrows} rows into {table_name} (chunks: {nchunks})")
                    
                    # Verify the data was actually written
                    cursor = conn.cursor()
                    cursor.execute(f"SELECT COUNT(*) FROM {sf_database}.{sf_schema}.{table_name}")
                    count_result = cursor.fetchone()
                    cursor.close()
                    results.append(f"VERIFICATION: Table {table_name} now has {count_result[0]} rows")
                else:
                    results.append(f"ERROR: write_pandas returned success=False for {table_name}")

            except Exception as e:
                error_msg = f"ERROR processing {name}: {str(e)}"
                results.append(error_msg)
                results.append(f"Traceback: {traceback.format_exc()}")

    except Exception as e:
        error_msg = f"CRITICAL ERROR: {str(e)}"
        results.append(error_msg)
        results.append(f"Traceback: {traceback.format_exc()}")
        
    finally:
        if conn:
            try:
                conn.close()
                results.append("Snowflake connection closed")
            except:
                pass

    return results
