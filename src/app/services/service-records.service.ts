import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const GET_VEHICLE_WITH_RECORDS = gql`
  query GetVehicleWithRecords($vin: String!) {
    getVehicle(vin: $vin) {
      id
      vin
      first_name
      last_name
      car_make
      car_model
      age_of_vehicle
      serviceRecords {
        id
        service_type
        description
        cost
        service_date
        mechanic_name
      }
    }
  }
`;

const GET_ALL_VEHICLES = gql`
  query GetAllVehicles($page: Int!, $limit: Int!) {
    getAllVehicles(page: $page, limit: $limit) {
      data {
        id
        vin
        first_name
        last_name
        car_make
        car_model
      }
    }
  }
`;

const GET_RECORDS_BY_VIN = gql`
  query GetRecordsByVin($vin: String!) {
    serviceRecordsByVin(vin: $vin) {
      id
      service_type
      description
      cost
      service_date
      mechanic_name
    }
  }
`;

const CREATE_RECORD = gql`
  mutation CreateRecord($input: CreateRecordInput!) {
    createRecord(createRecordInput: $input) {
      id
      vin
      service_type
      description
      cost
      service_date
      mechanic_name
    }
  }
`;

const UPDATE_RECORD = gql`
  mutation UpdateRecord($id: String!, $input: UpdateRecordInput!) {
    updateRecord(id: $id, updateRecordInput: $input) {
      id
      service_type
      description
      cost
      service_date
      mechanic_name
    }
  }
`;

const DELETE_RECORD = gql`
  mutation DeleteRecord($id: String!) {
    removeRecord(id: $id) {
      id
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class ServiceRecordsService {
  constructor(private apollo: Apollo) {}

  // Get vehicle with service records by VIN
  getVehicleWithRecords(vin: string): Observable<any> {
    return this.apollo
      .query({
        query: GET_VEHICLE_WITH_RECORDS,
        variables: { vin },
        fetchPolicy: 'network-only'
      })
      .pipe(map((result: any) => result.data.getVehicle));
  }

  // Get all vehicles for dropdown
  getAllVehicles(page: number = 1, limit: number = 100000): Observable<any[]> {
    return this.apollo
      .query({
        query: GET_ALL_VEHICLES,
        variables: { page, limit }
      })
      .pipe(
        map((result: any) => 
          result.data.getAllVehicles.data.map((v: any) => ({
            label: `${v.first_name} ${v.last_name} - ${v.car_make} ${v.car_model} (${v.vin})`,
            value: v.vin,
            data: v
          }))
        )
      );
  }

  // Get service records by VIN
  getRecordsByVin(vin: string): Observable<any[]> {
    return this.apollo
      .query({
        query: GET_RECORDS_BY_VIN,
        variables: { vin },
        fetchPolicy: 'network-only'
      })
      .pipe(map((result: any) => result.data.serviceRecordsByVin));
  }

  // Create new service record
  createRecord(input: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: CREATE_RECORD,
        variables: { input }
      })
      .pipe(map((result: any) => result.data.createRecord));
  }

  // Update existing service record
  updateRecord(id: string, input: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: UPDATE_RECORD,
        variables: { id, input }
      })
      .pipe(map((result: any) => result.data.updateRecord));
  }

  // Delete service record
  deleteRecord(id: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: DELETE_RECORD,
        variables: { id }
      })
      .pipe(map((result: any) => result.data.removeRecord));
  }
}