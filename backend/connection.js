const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'https://elastic:' + process.env.ELASTICSEARCH_PW + '@5b062dc99ee642d18e9273fc3c63a55f.us-east-1.aws.found.io:9243/' })

module.exports = client;
