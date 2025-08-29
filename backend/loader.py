import os, re, pandas as pd, requests
from requests.adapters import HTTPAdapter  #
from snowflake.connector.pandas_tools import write_pandas  
from urllib3.util.retry import Retry
import snowflake.connector

# ---------- Snowflake Credentials ----------
sf_user = "KINGKONG"
sf_password = "Constant127496"
sf_account = "LHHLNLP-EPB47564"
sf_role = "ACCOUNTADMIN"
sf_warehouse = "COMPUTE_WH"
sf_database = "HACKATHON"
sf_schema = "RAW"

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

def run_loader(api_list: list[str]):
    session = create_retry_session()
    conn = snowflake.connector.connect(
        user=sf_user, password=sf_password, account=sf_account,
        role=sf_role, warehouse=sf_warehouse,
        database=sf_database, schema=sf_schema,
    )

    results = []
    sources = {f"source_{i+1}": url for i, url in enumerate(api_list) if url.strip()}

    for name, url in sources.items():
        try:
            if url.endswith(".csv"):
                df = pd.read_csv(url)
            elif url.endswith(".parquet"):
                df = pd.read_parquet(url)
            else:
                response = session.get(url, timeout=15)
                response.raise_for_status()
                df = pd.DataFrame(response.json())

            if df.empty:
                results.append(f"{name} is empty, skipped")
                continue

            table_name = name.replace(".csv","").replace(".parquet","").replace("-","_").upper()
            original_columns = df.columns.tolist()
            df.columns = [sanitize_column(c) for c in df.columns]
            seen, final = {}, []
            for c in df.columns:
                if c in seen:
                    seen[c]+=1; final.append(f"{c}_{seen[c]}")
                else:
                    seen[c]=0; final.append(c)
            df.columns = final
            for c in df.select_dtypes(include=['object']).columns:
                df[c] = df[c].astype(str)
            df = df.where(pd.notnull(df), None)

            success, nchunks, nrows, _ = write_pandas(
                conn, df, table_name,
                overwrite=True, auto_create_table=True, quote_identifiers=False
            )
            if success:
                results.append(f"✅ Loaded {nrows} rows into {table_name}")
            else:
                results.append(f"⚠️ Failed writing {table_name}")

        except Exception as e:
            results.append(f"❌ Failed {name}: {e}")

    conn.close()
    return results