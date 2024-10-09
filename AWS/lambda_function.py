import json
import os
import  pymysql 

# Define RDS details
rds_host = os.environ['dbendpoint']
db_username = os.environ['dbusername']
db_password = os.environ['dbpassword']
db_name = os.environ['dbname']

# Establish connection (use this part within your Lambda handler function)
def lambda_handler(event, context):
    # Extract parameters from the API Gateway event
    param1 = event['queryStringParameters']['param1']
    param2 = event['queryStringParameters']['param2']
    
    # Connect to the database
    connection = pymysql.connect(
        host=rds_host,
        user=db_username,
        password=db_password,
        db=db_name,
        connect_timeout=5
    )
    
    try:
        with connection.cursor() as cursor:
            # Insert the data into your RDS table
            sql = "INSERT INTO your_table_name (column1, column2) VALUES (%s, %s)"
            cursor.execute(sql, (param1, param2))
            connection.commit()
        
        return {
            'statusCode': 200,
            'body': json.dumps('Data inserted successfully!')
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error inserting data: {str(e)}")
        }
    
    finally:
        connection.close()
