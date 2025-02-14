import { Hono } from 'hono';
import { MaterialsService } from './materials.service';
import { DomainTrace, publishEvent, createCommand } from '../../infra/events/event.publisher';
import { CreateMaterialCmd } from "../../domain/materials/materials.model";
import { v4 as uuidv4 } from 'uuid';

const materialsService = new MaterialsService();
const app = new Hono();

app.get('/materials', (c) => {
  return c.json(materialsService.getAll());
});

app.get('/materials/:id', (c) => {
  const material = materialsService.getById(c.req.param('id'));
  if (material) {
    return c.json(material);
  }
  return c.notFound();
});

app.post('/materials', async (c) => {
  const material = await c.req.json();
  //we receive the DTO from the outside, and we validate it
  //from the DTO we need to create the command, because our service methods only accept commands and give back events or failures
  //to create the cmd we also need to extract the domain trace from headers
  const domainTrace: DomainTrace = {
    correlationid: uuidv4(),
    causationid: null
  }
  const createMaterialCmd: CreateMaterialCmd = createCommand('create-material')({ data: material })(domainTrace)
  const res = materialsService.create(createMaterialCmd);
  //service methods give back either events or failures
  if(res._d === 'failure'){
    return c.json(res.cause, 200);
  }

  if(res._d === 'success'){
    publishEvent(res.data);
    return c.json(res.data, 201);
  }
});

app.put('/materials/:id', async (c) => {
  const updatedMaterial = await c.req.json();
  const material = materialsService.update(c.req.param('id'), updatedMaterial);
  if (material) {
    publishEvent('MaterialUpdated', material);
    return c.json(material);
  }
  return c.notFound();
});

app.delete('/materials/:id', (c) => {
  const success = materialsService.delete(c.req.param('id'));
  if (success) {
    publishEvent('MaterialDeleted', { id: c.req.param('id') });
    return c.text('Deleted');
  }
  return c.notFound();
});

export default app;
