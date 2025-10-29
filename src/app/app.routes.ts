import { Routes } from '@angular/router';
import { VehiclesComponent } from './vehicles/vehicles.component';
import { ServiceRecordsComponent } from './service-records/service-records.component';

export const routes: Routes = [
  { path: '', component: VehiclesComponent }, // default
  { path: 'service-records', component: ServiceRecordsComponent },
];
