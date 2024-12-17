import "dotenv/config"
import connectDB from "./db/index.js"
import {app} from "./app.js"
const PORT = process.env.PORT || 5000

connectDB()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`Server is running at http://localhost:${PORT}`);
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed ",err);
})