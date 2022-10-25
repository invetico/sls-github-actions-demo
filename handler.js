'use strict';

const DynamoDb = require('aws-sdk/clients/dynamodb');
const documentClient = new DynamoDb.DocumentClient({ 
  region: 'ap-southeast-2',
  maxRetries: 3,
  httpOptions: {
    timeout: 5000
  }
});
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode, data) => {
  return {
    statusCode,
    body: JSON.stringify(data)
  }
}

module.exports.createnote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("");
  let data = JSON.parse(event.body);
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: data.id,
        title: data.title,
        body: data.body
      },
      ConditionExpression: "attribute_not_exists(notesId)"
    }
    await documentClient.put(params).promise();
    callback(null, send(201, data));

  } catch (err) {
    callback(null, send(500, err.essage));
  }
};

module.exports.updatenote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let noteId = event.pathParameters.id;
  let data = JSON.parse(event.body);
  try {
    let params = {
      TableName: NOTES_TABLE_NAME,
      Key: { 
        notesId: noteId 
      },
      UpdateExpression: 'set #title = :title, #body = :body',
      ExpressionAttributeNames: {
        '#title' : 'title',
        '#body' : 'body'
      },
      ExpressionAttributeValues: {
        ':title' : data.title,
        ':body': data.body
      },
      ConditionExpression: 'attribute_exists(notesId)'
    }

    await documentClient.update(params).promise();

    callback(null, send(200, data));

  } catch (err) {
    callback(null, send(500, err.message));
  }
};

module.exports.deletenote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let noteId = event.pathParameters.id;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: {
        notesId: noteId
      },
      ConditionExpression: 'attribute_exists(notesId)'
    }

    await documentClient.delete(params).promise();

    callback(null, send(200, noteId));

  } catch (err) {
    callback(null, send(500, err.message));
  }
};

module.exports.getallnotes = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
    }

    const notes = await documentClient.scan(params).promise();

    callback(null, send(200, notes));

  } catch (err) {
    callback(null, send(500, err.message));
  }
};