import { Hono } from 'hono';
import { MaterialsService } from './materials.service';
import { DomainTrace, publishEvent, createCommand } from '../../infra/events/event.publisher';
import { CreateMaterialCmd, 
  CreateMaterialFailures, 
  CreateMaterialPayload, 
  Failure, 
  MaterialCreatedEvent, 
  MaterialCreatedPayload, 
  UpdateMaterialCmd,
  MaterialUpdatedEvent,
  UpdateMaterialFailures,
  Success } from "../../domain/materials/materials.model";
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
  const bodyData = await c.req.json();
  const material: CreateMaterialPayload = bodyData;
  //we receive the DTO from the outside, and we validate it
  //from the DTO we need to create the command, because our service methods only accept commands and give back events or failures
  //to create the cmd we also need to extract the domain trace from headers
  const domainTrace: DomainTrace = {
    correlationid: uuidv4(),
    causationid: null
  }

  const createMaterialCmd: CreateMaterialCmd = createCommand('create-material')({ data: material })(domainTrace) as CreateMaterialCmd
  const res: Success<MaterialCreatedEvent> | Failure<CreateMaterialFailures> = materialsService.create(createMaterialCmd);
  //service methods give back either events or failures
  if(res._d === 'failure'){
    return c.json(res.cause, 200);
  }

  if(res._d === 'success'){
    publishEvent(res.data);
    return c.json(res.data.data, 201);
  }
});

app.put('/materials/:id', async (c) => {
  const materialId: string = c.req.param('id');
  const updatedMaterial: Partial<MaterialCreatedPayload> = await c.req.json();
  const domainTrace: DomainTrace = {
    correlationid: uuidv4(),
    causationid: null
  }

  const updateMaterialCmd: UpdateMaterialCmd = createCommand('update-material')({ data: updatedMaterial })(domainTrace) as UpdateMaterialCmd
  const res: Success<MaterialUpdatedEvent> | Failure<UpdateMaterialFailures> = materialsService.update(materialId, updateMaterialCmd);

  if(res._d === 'failure'){
    if (res.cause === 'does_not_exists') {
      return c.notFound();
    }
    return c.json(res.cause, 200);
  }

  if (res._d === 'success') {
    publishEvent(res.data);
    return c.json(res.data.data, 200)
  }
});

// app.delete('/materials/:id', (c) => {
//   const success = materialsService.delete(c.req.param('id'));
//   if (success) {
//     publishEvent('MaterialDeleted', { id: c.req.param('id') });
//     return c.text('Deleted');
//   }
//   return c.notFound();
// });

export default app;
