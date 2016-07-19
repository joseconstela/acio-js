# ![Acio.js](media/header.jpg)

Acio.js allows to split JS computing jobs across multiple browsers via it's embeddable library.

The library uses web sockets to deliver jobs and collect results, web workers for client-side secure code execution and indexedDB for storage.

Visit [Acio.js website](https://joseconstela.github.io/acio-js/) for more information.

<hr>

Remember to visit Acio.js management panel repository: [joseconstela/acio.js-panel](http://joseconstela.com/acio-js-panel)

<hr>

## Installation
Download and install NodeJS https://nodejs.org/en/download/

Install the server packages:

    npm install

If nececsary, specify your environment variables, as they have default values:

    export PORT=3001
    export MONGO_URL=mongodb://localhost:27017/database

## Usage
To launch the jobs server, simple execute:

    npm start
