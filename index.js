import axios from 'axios';
import { writeFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';
import nodemailer from 'nodemailer';
import { Buffer } from 'buffer';
import mailgun from 'mailgun-js';
import FormData from 'form-data';
import fetch from 'node-fetch';


const mailgunApiKey = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.DOMAIN;
const mg = mailgun({ domain: mailgunDomain, apiKey: mailgunApiKey });

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const handler = async (event, context) => {
    try {
      const snsMessage = JSON.parse(event.Records[0].Sns.Message);
      console.log(snsMessage);
      const submission_url = snsMessage.submissionUrl;
      console.log(submission_url);
      const emailID = snsMessage.emailId;
      console.log(emailID);

      const emailData = {
        from: "noreply@demo.sangramvuppala.me",
        to: "vuppala.s@northeastern.edu",
        subject: 'File Upload Notification',
        text: `sns mail ${emailID} and bucket file url ${emailID}`
      };

  await sendEmail(emailData, emailID);
} catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: `Internal Server Error: ${error}` };
  }
};

async function sendEmail(data, recipient) {
    return new Promise((resolve, reject) => {
      mg.messages().send(data, (error, body) => {
        if (error) {
          console.log("Unsuccessful email sending")
          reject(error);
        } else {
          console.log("Successful email sending")
          resolve(body);
        }
      });
    });
  }

  export async function trackEmail(user_email, subject, submission_url, status_msg,context) {
    try {
      const params = {      
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: {
          id: context.awsRequestId, // Use Lambda request ID as a unique identifier
          subscriptionurl: submission_url,
          sender: user_id,
          recipient: user_email,
          subject: subject,
          sentAt: new Date().toISOString(),
          email_status: status_msg,
        },
      };
      const result = await dynamoDB.put(params).promise();
      console.log(result)
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Updated email status in Dynamodb' }),
      };
    } catch (error) {
      console.error('Error:', error);
      return { statusCode: 500, body: `Internal Server Error: ${error}` };
    }
  }
