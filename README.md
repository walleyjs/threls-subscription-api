
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
    * Install MongoDB on your local.
    * Install node.js and npm on your local machine.
    * From the root of the project executes in terminal `npm install`.
    * Use the latest version of node on the local machine if the build fails.
    * Make a copy of **.env.example** file to **.env**.
    * Make a copy of **keys/private.pem.example** file to **keys/private.pem**.
    * Make a copy of **keys/public.pem.example** file to **keys/public.pem**.
    * Add your mongdb connection url to `DATABSE_CONNECTION_URL` in  **.env**.
    * Change the `DB_HOST` to `localhost` in **.env** file if you are using a local mongodb.
    * Execute `npm run seed` to run script that will create super admin, featears and plans data.
    * Execute `npm dev` and You will be able to access the API from http://localhost:3000