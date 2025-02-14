import fetch from 'node-fetch';
import { CloudEvent, httpTransport, emitterFor } from "cloudevents";

const clients = [
  { url: 'https://angeshisthe.co.in/materials', 
  events: ['MaterialCreated', 'MaterialUpdated', 'MaterialDeleted'], 
  clientSecret: "xyz", },
  
  // Add more clients as needed
];


export async function sendWebhook(event: CloudEvent<unknown>) {
  // Observable to fetch all the clients
  // If subscribed to the event, create the cloud event and handle the Response
  // with aretry and create a failed event and publish it.

  for (const client of clients) {
    if (client.events.includes(event.type)) {
      // await fetch(client.url, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // });
      const event2 = event.cloneWith({secret: client.clientSecret});
      const emit = emitterFor(httpTransport(client.url));
      const res: WebHookResponse = await emit(event2) as WebHookResponse;

      // if failure, retry with counter
        // If retry counter exceeds, create failed event.
      // If ERROR, log error and create failed event

      console.log(res);
    }
  }
}

type WebHookResponse = WebHookSuccess | WebHookFailure;
type WebHookSuccess = { status: 'success' };
type WebHookFailure = { status: 'failure', error: string };
