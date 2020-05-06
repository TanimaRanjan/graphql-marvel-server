const express = require('express')
const graphqlHTTP = require('express-graphql')
const app = express()

// Schema 
const schema = require('./schema')

app.use('/graphql', graphqlHTTP({
    schema,
    graphiql:true
}))

app.listen(4000, () => {
    console.log('listening on 4000')
})