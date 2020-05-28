# Needle API

Needle is an application designed to help you track your
notes, events, and habits.

## Required Dependencies

Needle API has two software dependencies:

### 1. [NodeJS 13.9.0](https://nodejs.org/en/download/)

### 2. [MongoDB 4.2.3](https://www.mongodb.com/download-center/community)

## Required Configuration

Before running the API and getting started there are a few steps that 
must be completed.

**_NOTE:_** *These steps assume you are using a Linux operating system, the 
equivalent Windows commands will have to be researched on your own.*

**_You must complete all steps to start the API_**

### 1. Configure HTTPS
This step may be completed by providing a CA signed certificate, assuming 
you have the .pem files, or by generating a self-signed certificate 
as shown below:

```
mkdir -p needle/config/ssl
cd needle/config/ssl
openssl req -x509 -nodes -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
```
*You will be asked questions when generating the self-signed certificate, answer the prompts until the process completes*

### 2. Configure db_config.json
Create a new database configuration file using the following path / template, found below:

**needle/config/db_config.json**

```
{
  "dbHost": "YOUR_DATABASE_HOSTNAME_GOES_HERE",
  "dbPort": "YOUR_DATABASE_PORT_GOES_HERE",
  "dbName": "YOUR_DATABASE_NAME_GOES_HERE",
  "options": {
    "user": "YOUR_AUTH_USERNAME_GOES_HERE",
    "pass": "YOUR_AUTH_PASSWORD_GOES_HERE",
    "authSource": "YOUR_AUTH_DATABASE_GOES_HERE"
  }
}
```

### 3. Configure auth_config.json
This API utilizes JSON web tokens for authentication. This requires that a secret password be provided via config file.
Since private data is not supposed to be stored in a repo, you will have to create your own file.

Create a new auth configuration file using the following path / template, found below:

**needle/config/auth_config.json**

```
{
  "secret": "YOUR_AUTH_SECRET_GOES_HERE"
}
```

**_NOTE:_** This secret key can be any string your choose.

### 4. Install Node Modules
Run the following command from the _root of the cloned repository_ to
install node modules required for the API.
```
npm install
```

## Start Up
**_After all Install Dependencies and Required Configuration steps have been completed, use the following command
to start the API._**
```
npm run start
```

## Test Suite
Needle comes with a complete unit test suite that can be ran using the following steps:

In one terminal Start Up the API server from the root of the cloned repository 
with the following command:
```
npm run start
```

In another terminal instance run the following command from the root of the cloned repository 
to execute the full test suite:
```
npm run test
```
