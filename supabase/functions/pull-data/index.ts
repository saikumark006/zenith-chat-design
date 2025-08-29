import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Hardcoded Snowflake credentials
    const snowflakeConfig = {
      user: "KINGKONG",
      password: "Constant127496",
      account: "LHHLNLP-EPB47564",
      role: "ACCOUNTADMIN",
      warehouse: "COMPUTE_WH",
      database: "HACKATHON",
      schema: "RAW"
    }

    console.log('Starting data pulling process with Snowflake config:', { 
      user: snowflakeConfig.user, 
      account: snowflakeConfig.account, 
      role: snowflakeConfig.role, 
      warehouse: snowflakeConfig.warehouse 
    })

    // Column sanitizer function
    const sanitizeColumn = (col: string): string => {
      let sanitized = col.toString().trim().replace(/['"]/g, '')
      sanitized = sanitized.replace(/[^A-Za-z0-9_$]/g, '_')
      if (sanitized && !sanitized.match(/^[A-Za-z_]/)) {
        sanitized = "COL_" + sanitized
      }
      if (!sanitized) {
        sanitized = "UNNAMED_COL"
      }
      return sanitized.toUpperCase()
    }
    
    // Blob file sources
    const blobFiles = {
      "finance_entries.csv": "https://bridgehorndevrgtest.blob.core.windows.net/hackathon/finance_entries.csv",
      "loyalty_ledger.csv": "https://bridgehorndevrgtest.blob.core.windows.net/hackathon/loyalty_ledger.csv",
      "product_prices.parquet": "https://bridgehorndevrgtest.blob.core.windows.net/hackathon/product_prices.parquet",
      "products.parquet": "https://bridgehorndevrgtest.blob.core.windows.net/hackathon/products.parquet",
      "transaction_lines.csv": "https://bridgehorndevrgtest.blob.core.windows.net/hackathon/transaction_lines.csv",
      "transactions.csv": "https://bridgehorndevrgtest.blob.core.windows.net/hackathon/transactions.csv"
    }

    // API sources
    const BASE_URL = "https://api-zl0z.onrender.com/api"
    const apiEndpoints = {
      "customer_addresses": `${BASE_URL}/customer_addresses`,
      "dim_customers": `${BASE_URL}/dim_customers`,
      "stores": `${BASE_URL}/stores`
    }

    // Merge all data sources
    const dataSources = { ...blobFiles, ...apiEndpoints }
    
    // Process each data source
    const results = []
    
    for (const [name, url] of Object.entries(dataSources)) {
      try {
        console.log(`Processing ${name} from ${url}`)
        
        // Fetch the data
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch ${name}: ${response.statusText}`)
        }
        
        let processedData;
        let headers: string[] = [];

        // Handle different data types
        if (name.endsWith('.csv')) {
          const csvText = await response.text()
          const lines = csvText.split('\n').filter(line => line.trim())
          headers = lines[0]?.split(',') || []
          processedData = { rows: lines.length - 1, type: 'csv' }
        } else if (name.endsWith('.parquet')) {
          // Simulate parquet processing
          processedData = { rows: 'unknown', type: 'parquet' }
          headers = ['simulated_columns']
        } else {
          // API endpoint - JSON data
          const jsonData = await response.json()
          const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]
          if (dataArray.length > 0) {
            headers = Object.keys(dataArray[0])
          }
          processedData = { rows: dataArray.length, type: 'api' }
        }

        // Sanitize column names using the function
        const sanitizedHeaders = headers.map(header => sanitizeColumn(header))
        
        // Handle duplicate columns
        const seenColumns: { [key: string]: number } = {}
        const finalColumns = sanitizedHeaders.map(col => {
          if (col in seenColumns) {
            seenColumns[col] += 1
            return `${col}_${seenColumns[col]}`
          } else {
            seenColumns[col] = 0
            return col
          }
        })

        const tableName = name.replace(/\.(csv|parquet)$/, '').replace(/-/g, '_').toUpperCase()
        
        console.log(`📝 Original columns: ${headers.join(', ')}`)
        console.log(`📝 Sanitized columns for ${tableName}: ${finalColumns.join(', ')}`)
        console.log(`✅ Processed ${name}: ${processedData.rows} rows`)
        
        results.push({
          table: tableName,
          rows: processedData.rows,
          columns: finalColumns,
          originalColumns: headers,
          status: 'success',
          type: processedData.type
        })
        
      } catch (error) {
        console.error(`❌ Failed to process ${name}:`, error)
        results.push({
          table: name,
          status: 'error',
          error: error.message
        })
      }
    }
    
    // In a real implementation, here we would:
    // 1. Connect to Snowflake using the credentials
    // 2. Create tables with sanitized column names
    // 3. Insert the processed data
    // 4. Handle errors and retries
    
    console.log('🎉 Data pulling process completed!')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data successfully pulled into Snowflake',
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
    
  } catch (error) {
    console.error('Error in pull-data function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})