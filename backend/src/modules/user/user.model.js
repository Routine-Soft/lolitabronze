import mongoose from 'mongoose'
import { ROLES } from '../shared/enums/roles.enum.js'

// Definindo o esquema do usuário
const userSchema = new mongoose.Schema({
    name: { type: String, required: false },
    email: { type: String, required: false, unique: true },
    password: { type: String, default: null },

    roles: [{
        type: String,
        enum: Object.values(ROLES),
    }],

    token: { type: String, required: false },
    tokenRefresh: { type: String, required: false },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    
}, { timestamps: true });

// Nunca retornar a senha no JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.token
  delete obj.tokenRefresh
  delete obj.resetPasswordToken
  delete obj.resetPasswordExpires
  return obj
}

// Verifica se o modelo já foi definido
const UserModel = mongoose.models.usuarios || mongoose.model('users', userSchema);

export default UserModel;
