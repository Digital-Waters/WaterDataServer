# WaterDataServer
Where all the water monitoring devices send their data to. The server will collect, organize, store, analyze, and share data collected from water monitoring devices in the field.

This code isn't much more than simple data collection and storage. All image data is stored in Amazon S3 storage, links to the actual images are in our Heroku Postgres database. This Python code properly stores incoming data from water monitoring devices into the appropriate locations for further processing.
