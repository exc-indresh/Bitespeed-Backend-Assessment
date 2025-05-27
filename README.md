### **Setup Instruction**
- Install PostgreSQL database and Node.js
- Clone the repository:
```bash
  git clone <repository-url>
```
  
- Move to project directory & install all the dependencies using following command
```bash
npm install
```
- Add your postgresql database password in .env file and run the following command
```bash
npx prisma migrate dev --name init
npx prisma generate
```
- Add the following code in your package.json file under scripts
```
"dev": "ts-node-dev --respawn src/index.ts"
```
- Run the code by following code
```
npm run dev
```
- Now test the API
