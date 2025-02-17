import { CloudEvent, HTTP } from 'cloudevents';
import { sendToQueue } from './event.queue';


export function publishEvent(event: CloudEvent<unknown>) {
  sendToQueue(event);
}


export type CreateEvent = <T>(type: string) => (data: T) => (domainTrace: DomainTrace) => CloudEvent<T>;
export const createEvent: CreateEvent = <T>(type: string) => (data: T) => (domainTrace: DomainTrace) => {
  const event: CloudEvent<T> = new CloudEvent({
    type,
    messagetype: 'event',
    source: '/materials',
    data,
    ...domainTrace
  });
  return event;
}

export const createCommand: CreateEvent = <T>(type: string) => (data: T) => (domainTrace: DomainTrace) => {
  const event: CloudEvent<T> = new CloudEvent({
    type,
    messagetype: 'command',
    source: '/materials',
    ...data,
    ...domainTrace
  });
  return event;
}

export type DomainTrace = {
  correlationid: string,
  causationid: string | null
}

export type DomainTraceFromMsg = (msg: CloudEvent<unknown>) => DomainTrace

export const domainTraceFromMsg: DomainTraceFromMsg = (msg: CloudEvent<unknown>) => {
  return {
    correlationid: msg.correlationid as string,
    causationid: msg.id
  }
}