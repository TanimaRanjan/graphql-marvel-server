const fetch = require('node-fetch')
const md5 = require('md5')
const { 
    GraphQLObjectType, 
    GraphQLSchema, 
    GraphQLInt, 
    GraphQLString,
    GraphQLList }
     = require('graphql')

const ts = new Date().getTime()
const key =  require('./env')
const pk = key.MARVEL_API_PRIVATE_KEY
const k = key.MARVEL_API_PUBLIC_KEY
const hash = md5(ts+pk+k)

const API_ENDPOINT = 'https://gateway.marvel.com:443/v1/public/'
//characters?limit=100&offset=20'
const PARAM_API='apikey='
const PARAM_LIMIT='limit='
const PARAM_LIMIT_COUNT='100'
const PARAM_OFFSET='offset='
const PARAM_OFFSET_COUNT='0'
const PARAM_CHARACTER = 'characters' 
const PARAM_COMICS = 'comics'

 const type='characters'
 const offset_count = 0
 let url  = `${API_ENDPOINT}${type}?${PARAM_API}${k}&ts=${ts}&hash=${hash}`

// const resp = fetch(url
// ).then(response => response.json()
// ).then(result => console.log(JSON.stringify(result, null,2)))

const ComicsType = new GraphQLObjectType({
    name:'Comics',
    description:'...',

    fields: () => ({
        name: {
            type:GraphQLString,
        },
        Id : {
            type:GraphQLString,
            resolve : (parent)  =>  {
                const id = parent.resourceURI.split('/comics/')[1]
            }
        }
        
    })
})

const ComicType = new GraphQLObjectType({
    name:'Comic',
    description:'...',
    fields: () => ({
        title: {
            type:GraphQLString
        },
        id: {
            type:GraphQLInt
        },
        description : {
            type:GraphQLString
        },
        upc : {
            type:GraphQLString
        }
    })
})

const UrlType = new GraphQLObjectType({
    name: 'Url',
    fields : () => ({
        type: { type:GraphQLString },
        
    })
})

const CharacterType = new GraphQLObjectType({
    name:'Character',
    description:'....',
    fields: () => ({
        id: {
            type:GraphQLInt
        },
        name: {
            type:GraphQLString
        },
        description: {
            type:GraphQLString
        },
        imageURL : {
            type:GraphQLString,
            resolve: (parent) => `${parent.thumbnail.path}.${parent.thumbnail.extension}`
        },
        comics: {
            type:GraphQLList(ComicType),
            resolve: (parent) =>  {

                // Adding lazing loading for details on Comics 
                // If the user request Comics then this part is called. 
                const ids = parent.comics.items.map(item => parseInt(item.resourceURI.split('/comics/')[1]))
                return Promise.all(ids.map(id => 
                    fetch(`${API_ENDPOINT}comics/${id}?${PARAM_API}${k}&ts=${ts}&hash=${hash}`
                    ).then(response => response.json()
                    ).then(result => result.data.results[0])
                    ))
                
            }

        },
        series: {
            type:GraphQLList(ComicsType),
            resolve:(parent) => parent.series.items
        },
        stories: {
            type:GraphQLList(ComicsType),
            resolve:(parent) => parent.stories.items
        },
        urls : {
            type:GraphQLList(UrlType),
            resolve:(parent) => parent.urls
        }
    })
})


module.exports = new GraphQLSchema({
    query: new GraphQLObjectType({
        name:'Query',
        description:'...',
        fields:() => ({

            
            character: {
                type:CharacterType,
                args: {
                    id: {type:GraphQLInt }
                }, 
                resolve: (root , args ) => fetch(
                    `${API_ENDPOINT}${type}/${args.id}?limit=100&${PARAM_API}${k}&ts=${ts}&hash=${hash}`
                ).then(response => response.json()
                ).then(result => {
                    console.log('Getting characters')
                    return result.data.results[0]
                } )
            }, 

            characters: {
                type:GraphQLList(CharacterType),
                resolve: (root) => fetch(
                    `${API_ENDPOINT}${type}?limit=100&${PARAM_API}${k}&ts=${ts}&hash=${hash}`
                ).then(response => response.json()
                ).then(result => { 
                    console.log('Getting all characters')
                    return result.data.results
                })
                
            },

            characterNameStartsWith: {
                type:GraphQLList(CharacterType),
                args: {
                    name: {type:GraphQLString }
                }, 
                resolve: (root , args) => fetch(
                    `${API_ENDPOINT}${type}?nameStartsWith=${args.name}&limit=100&${PARAM_API}${k}&ts=${ts}&hash=${hash}`
                ).then(response => response.json()
                ).then(result => result.data.results)
            }, 

            characterByName: {
                type:CharacterType,
                args: {
                    name: {type:GraphQLString }
                }, 
                resolve: (root , args ) => fetch(
                    `${API_ENDPOINT}${type}?name=${args.name}&limit=100&${PARAM_API}${k}&ts=${ts}&hash=${hash}`
                ).then(response => response.json()
                ).then(result =>result.data.results[0])
            }, 

        })

    })
})
    