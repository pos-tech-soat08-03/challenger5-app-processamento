const swaggerAutogen = require('swagger-autogen')({ language: 'pt-BR', openapi: '3.0.0' });

const doc = {
  info: {
    title: 'Microserviço de Status v1.0 - Documentação da API.',
    description: 'Challenge5 SOAT8 Grupo 03 - Microserviço de Status e Reprocessamento'
  },

  schemes: ['http'],

  components: {
    securitySchemes:{
        bearerAuth: {
            type: 'http',
            scheme: 'bearer'
        }
    }
  }
};

const outputFile = './swagger-output.json';
const routes = ['./app.ts', './src/Infrastructure/Api/*.ts'];

swaggerAutogen(outputFile, routes, doc);