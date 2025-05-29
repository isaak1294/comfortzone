# Setup:

#### Mock a postgresql database:

You may do this however you like. Once you have a mocked postgresql database. Change the DATABASE_URL environment variable in ./comfortzone-backend.env to your new database url.

#### Start the server:

To start the server you'll need one terminal in comfortzone-frontend, one terminal in comfortzone-backend, and one terminal for the mailserver. Then run the following commands:

Frontend:
npm install
npm run dev

Backend:
npm install
npx prisma db push
node index.js

Mailserver:
maildev


This should allow you to view the page on localhost:3000, the backend will be on localhost:4000, and the mailserver will be viewable on localhost:1080.


#### Set environment variables:

Your .env file should look like this after unzipping:

JWT_SECRET=supersecretkey123
DATABASE_URL=postgresql://confortuser:comfortpass@localhost:5432/comfortzone_dev
NEXT_PUBLIC_API_BASE=http://localhost:4000
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=test@example.com
APP_URL=http://localhost:4000


You're going to need to change the DATABASE_URL based on your own database, and could potentially need to change the names of your mailserver variables to match the response (but they're probably fine.)


#### Testing:

Open the maildev web app on your local port and test the app with that. You should be able to make accounts and test their interactions by switching between them.
