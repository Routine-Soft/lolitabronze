//importing mongoose
import mongoose from 'mongoose'

//Connecting MongoDB to Mongoose. Var with a function inside
const db = async () => {
    await mongoose.connect(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@clusterlolitabronze.zamcqzh.mongodb.net/lolitabronze?retryWrites=true&w=majority`, {
    }).then(() => {
        console.log('Conectado ao MongoDB')
    }).catch((error) => {
        console.log('Erro ao conectar ao MongoDB ' + error)
    
    }) 
}

export default db