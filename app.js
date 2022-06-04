import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import connectDB from './config/connectdb.js'

const app = express()
const port = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL

app.use(cors())

app.get('/hello', (req, res) => {
    console.log('Hello World')
    res.send('Hello World')
})

// Connect Database
connectDB(DATABASE_URL)


app.listen(port, () => {
    console.log(`Server listening at http://127.0.0.1:${port}`)
})