import { CloudEvent, HTTP } from 'cloudevents';
import { v4 as uuidv4 } from 'uuid';
import { sendToQueue } from './event.queue';
import { MaterialCreatedPayload } from "../../domain/materials/materials.model";


export function publishEvent(type: string, data: MaterialCreatedPayload) {
  const event: CloudEvent<MaterialCreatedPayload> = new CloudEvent({
    id: uuidv4(),
    type,
    source: '/materials',
    data,
    correlationid: uuidv4(),
    causationid: uuidv4(),
  });

  sendToQueue(event);
}


export type CreateEvent = <T>(type: string) => (data: T) => (domainTrace: DomainTrace) => CloudEvent<T>;
const createEvent: CreateEvent = <T>(type: string) => (data: T) => (domainTrace: DomainTrace) => {
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
    data,
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