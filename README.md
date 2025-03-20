
# Project Highlights 
1. Node.js
2. Express.js
3. Typescript
4. Mongoose
5. Redis
6. Mongodb
7. Joi
8. Unit Tests & Integration Tests
9. Docker
10. JWT

## How to build and run this project

 * Installation flow
    * Make a copy of **.env.example** file to **.env**.
    * Make a copy of **keys/private.pem.example** file to **keys/private.pem**.
    * Make a copy of **keys/public.pem.example** file to **keys/public.pem**.
    * Make a copy of **tests/.env.test.example** file to **tests/.env.test**.
    * Do steps 1 to 5 as listed for **Install using Docker Compose**.
    * Do steps 1 to 3 as listed for **Run The Tests**.
    * Create users in MongoDB and seed the data taking reference from the **addons/init-mongo.js**
    * Change the `DB_HOST` to `localhost` in **.env** and **tests/.env.test** files.
    * Execute `npm dev` and You will be able to access the API from http://localhost:3000
    * To run the tests execute `npm test`.
* Run The Tests
    * Install node.js and npm on your local machine.
    * From the root of the project executes in terminal `npm install`.
    * *Use the latest version of node on the local machine if the build fails*.
    * To run the tests execute `npm test`.