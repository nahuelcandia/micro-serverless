RUN INSTRUCTIONS

The name in the package.json will change depending of the environment.
1. Install dependencies: npm install
2. Run corresponding environment mode:

Development: sls deploy-dev


3. Deploy if necessary

Deployment will not happen without the credentials: ~/keys/googlecloud.json
Also, when commit to the respective branch, JENKINS will do the deployment automatically.

(DEPLOY) Staging: sls deploy-staging
(DEPLOY) Sandbox: sls deploy-sandbox
(DEPLOY) production: sls deploy-production


CREATING NEW microservice

Use the code in the respository microservice-template
Change in serverless.yml the value of microservicename for its name. Use lowercase, 0-9, no spaces, or slashes or special symbols. When possible one word only.
3. Deploy/create functions.
The functions will be created automatically for each environment as they are run. Run deployment as indicated in step 2.
