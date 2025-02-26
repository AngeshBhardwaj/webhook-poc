import { from, of, Observable } from 'rxjs';
import { mergeMap, catchError, delay, take, tap, reduce, expand, takeWhile } from 'rxjs/operators';
import fetch from 'node-fetch';
import { CloudEvent, httpTransport, emitterFor } from "cloudevents";

const clients = [
  { url: 'https://webhook.site/dff49f50-662b-4562-81ea-661ef555e75b', 
    events: ['material-created', 'material-deleted'], 
    clientSecret: "xyz", 
  },
  { url: 'https://webhook.site/76d63fe4-af3e-4b0c-9ad8-ca411057d5cb', 
    events: ['material-created', 'material-updated', 'material-deleted'], 
    clientSecret: "xyz", 
  },
  { url: 'https://webhookangesh.site/dff49f50-662b-4562-81ea-661ef555e75x', 
    events: ['material-created', 'material-updated', 'material-deleted'], 
    clientSecret: "xyz", 
  },
  // Add more clients as needed
];

export async function sendWebhook(event: CloudEvent<unknown>) {
  // console.log(`Sending webhook to clients for event: ${event}`);
  from(clients)
    .pipe(
      mergeMap(client => {
        if (client.events.includes(event.type)) {
          const eventWithSecret = event.cloneWith({ secret: client.clientSecret });
          return sendEventToClient(client.url, eventWithSecret).pipe(
            // console log the response
            tap((response: WebHookResponse) => {
              console.log(`Received response from ${client.url}:`, response)
              // retry when response.status === 'failure' for 5 times
            }),
            expand((response: WebHookResponse) => {
              if (response.status === 'failure') {
                return of(response).pipe(delay(5000)); // Retry after 5 seconds
              }
              return of(response).pipe(takeWhile(() => false)); // Stop retrying if success
            }),
            catchError(error => {
              console.error(`Failed to send event to ${client.url}:`, error);
              const failureResponse: WebHookFailure = { status: 'failure', error: error.message };
              return of(failureResponse); // Return failure response to continue the stream
            }),
            take(3)
          );
        }
        return of(null); // Return null if the client is not subscribed to the event
      }),
      //reduce will accumulate the results
      reduce((acc, response) => {
        if (response) {
          acc.push(response);
        }
        return acc;
      }, [] as WebHookResponse[])
    )
    .subscribe({
      next: results => {
        console.log('All results:', results);
      },
      complete: () => {
        console.log('All webhooks processed.');
      },
      error: error => {
        console.error('Error processing webhooks:', error);
      }
    });
}

// Create an observable
function sendEventToClient(url: string, event: CloudEvent<unknown>): Observable<WebHookResponse> {
  return new Observable(observer => {
    console.log(`Sending event to ${url}:`, event);
    const emit = emitterFor(httpTransport(url));

    try {
      emit(event)
      .then((response: any) => {
        // *** Need to find a way to know the status code
        // console.log(`Sent event to ${url}:`, response?.status);

        const status: WebHookSuccess = { status: 'success' };
        observer.next(status);
        observer.complete();
      })
      .catch(error => {
        console.error(`Failed to send event to ${url}:`, error);
        const status: WebHookFailure = { status: 'failure', error: error.message };
        observer.next(status);
        observer.complete();
      });
    } catch (error) {
      console.error(`Failed to send event to ${url}:`, error);
      observer.error(error);
    }
  });
}


type WebHookResponse = WebHookSuccess | WebHookFailure;
type WebHookSuccess = { status: 'success' };
type WebHookFailure = { status: 'failure', error: string };
