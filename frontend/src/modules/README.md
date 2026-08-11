# Frontend MVC - Módulos Consumindo Backend

## 📋 Estrutura

Cada módulo tem:
- **service.js** - Chamadas à API
- **controller.js** - Gerenciamento de estado + lógica
- **dto.js** - Validações + transformações de dados
- **index.js** - Exporta tudo (barrel)

## 🚀 Quick Start

### Importar Controllers
```javascript
import { UserController } from '@/modules/user'
import { CustomerController } from '@/modules/customer'
import { ItemController } from '@/modules/item'
import { CashController } from '@/modules/cash'
import { OrderHistoryController } from '@/modules/orderHistory'
import { PrintController } from '@/modules/print'
```

### Usar nos Componentes
```javascript
// Subscrever para updates
UserController.subscribe(() => {
  // Componente será notificado quando dados mudarem
})

// Usar dados
<div>{UserController.currentUser?.name}</div>
<div>{UserController.loading ? 'Carregando...' : 'Pronto'}</div>
<div>{UserController.error}</div>

// Chamar ações
<button onClick={() => UserController.logout()}>Logout</button>
```

## 📦 Módulos Disponíveis

### User (Autenticação)
```javascript
// Login
await UserController.login(email, password)

// Logout
await UserController.logout()

// Criar usuário
await UserController.create(name, email, password, roles)

// Dados
UserController.currentUser // Usuário logado
UserController.users // Lista de usuários
UserController.isLoggedIn() // Booleano
UserController.hasRole('super_admin') // Booleano
```

### Customer (Clientes)
```javascript
// Criar
const customer = await CustomerController.create(name, phone)

// Listar (com busca)
await CustomerController.list('João')

// Get by ID
const customer = await CustomerController.getById(id)

// Atualizar
await CustomerController.update(id, name, phone)

// Deletar
await CustomerController.delete(id)

// Dados
CustomerController.customers // Array de clientes
```

### Item (Produtos/Serviços)
```javascript
// Criar
const item = await ItemController.create(
  name,
  description,
  'PRODUCT', // ou 'SERVICE'
  price,
  quantity, // só se PRODUCT
  discount
)

// Listar todos
await ItemController.list()

// Listar apenas produtos
await ItemController.listProducts()

// Listar apenas serviços
await ItemController.listServices()

// Get by ID
await ItemController.getById(id)

// Atualizar
await ItemController.update(id, name, description, type, price, quantity, discount)

// Deletar
await ItemController.delete(id)

// Dados
ItemController.items // Todos
ItemController.products // Apenas produtos
ItemController.services // Apenas serviços
```

### Cash (Caixa)
```javascript
// Abrir caixa
await CashController.openSession(valorAbertura, userId)

// Verificar se está aberto
CashController.isCashOpen() // Booleano

// Registrar movimentação específica
await CashController.registrarVenda(valor, descricao, userId, orderId)
await CashController.registrarDespesa(valor, descricao, userId)
await CashController.registrarSangria(valor, descricao, userId) // Retirada

// Ou genérica
await CashController.addMovement(tipo, categoria, valor, descricao, userId)

// Fechar caixa
const result = await CashController.closeSession(valorFechamento, userId)
// result.sessao - sessão fechada
// result.resumo - resumo com totais

// Dados
CashController.currentSession // Sessão aberta
CashController.movements // Array de movimentações
```

### OrderHistory (Pedidos)
```javascript
// Criar pedido (sinal é obrigatório)
const order = await OrderHistoryController.create(
  customerId,
  [{ itemId: '123', quantidade: 2 }],
  userId,
  'Observações',
  true // sinal OBRIGATÓRIO
)

// Listar
await OrderHistoryController.list()

// Get by ID
await OrderHistoryController.getById(id)

// Auxiliares
OrderHistoryController.calculateTotal(items) // Calcula total
OrderHistoryController.getOrderSummary(order) // Resumo formatado

// Dados
OrderHistoryController.orders // Array de pedidos
```

### Print (Impressão)
```javascript
// Imprimir recibo
try {
  await PrintController.printOrderReceipt(orderId)
  // Impressora térmica imprimiu
} catch (error) {
  // Pode ser: impressora não conectada, pedido não encontrado, etc
}

// Dados
PrintController.loading // boolean
PrintController.error // null ou mensagem de erro
PrintController.success // true se imprimiu com sucesso
```

## 🔄 Observer Pattern

Todos controllers notificam sobre mudanças:

```javascript
const unsubscribe = UserController.subscribe(() => {
  console.log('Algo mudou no UserController!')
  // Re-render seu componente aqui
})

// Para desinscrever:
// unsubscribe() - (se implementar)
```

## ⚠️ Tratamento de Erros

```javascript
try {
  await UserController.login(email, password)
} catch (error) {
  console.error(error.message)
  console.log(UserController.error) // Também está aqui
}

// Limpar erro
UserController.clearError()
```

## 🔐 Autenticação

- Tokens são salvos em `localStorage`
- Refresh automático quando token expira
- Se refresh falhar, redireciona para `/login`
- Use `UserController.isLoggedIn()` para verificar

## 📝 Validações

DTOs incluem validações:

```javascript
import { validateLogin, validateCustomer } from '@/modules'

const { isValid, errors } = validateLogin({ email, password })
if (!isValid) {
  console.log(errors) // { email: "...", password: "..." }
}
```

## 🎯 Casos de Uso

### Tela de Login
```javascript
await UserController.login(email, password)
// redirect to /home
```

### Sidebar com Roles
```javascript
{UserController.hasRole('super_admin') && <AdminMenu />}
{UserController.hasRole('recepcionista') && <ReceptionMenu />}
```

### Gerenciar Clientes
```javascript
await CustomerController.list() // Carregar
<CustomerList customers={CustomerController.customers} loading={CustomerController.loading} />
```

### Criar Pedido
```javascript
const items = [
  { itemId: product1.id, quantidade: 2 },
  { itemId: product2.id, quantidade: 1 }
]
await OrderHistoryController.create(customerId, items, userId)
```

### Abrir/Fechar Caixa
```javascript
// Abrir
await CashController.openSession(100, userId)

// Fazer vendas
await CashController.registrarVenda(150, 'Venda', userId, orderId)

// Fechar
const result = await CashController.closeSession(250, userId)
console.log(result.resumo.lucro) // Lucro do dia
```

## 📚 Documentação Completa

Veja `/memories/session/backend-structure.md` para:
- Todas as rotas do backend
- Estrutura dos dados
- Enums (ROLES, ITEM_TYPE, MOVEMENT_TYPE, etc)
