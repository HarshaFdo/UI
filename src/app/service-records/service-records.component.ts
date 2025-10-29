import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';

const GET_VEHICLE_WITH_RECORDS = gql`
  query GET_VEHICLE_WITH_RECORDS($vin: string!) {
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
  query GetAllVehicles {
    getAllVehicles(page: 1, limit: 1000) {
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
  query GetRecordsByVin($vin: string!) {
    getRecordsByVin(vin: $vin) {
      id
      service_type
      description
      cost
      service_date
      mechanic_name
    }
  }
`;

@Component({
  selector: 'app-service-records',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    FormsModule,
    DropdownModule,
    TableModule,
    MessageModule,
    ProgressSpinnerModule,
    DividerModule
  ],
  templateUrl: './service-records.component.html',
  styleUrl: './service-records.component.scss',
})
export class ServiceRecordsComponent implements OnInit {
  // Feature 1 - search by vin
  vinSearchControl = new FormControl('');
  searchedVehicle: any = null;
  searchLoading = false;
  searchError: string | null = null;

  // Feature 2 - dropdown
  vehicles: any[] = [];
  selectedVehicle: any = null;
  selectedVehicleRecords: any[] = [];
  dropdownLoading = false;
  dropdownError: string | null = null;

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {
    this.loadAllVehicles();
  }

  // Feature 1
  searchByVin(): void {
    const vin = this.vinSearchControl.value?.trim();
    if (!vin) {
      this.searchError = 'Please enter a valid VIN';
      return;
    }

    this.searchLoading = true;
    this.searchError = null;
    this.searchedVehicle = null;

    this.apollo
      .query({
        query: GET_VEHICLE_WITH_RECORDS,
        variables: { vin },
      })
      .subscribe({
        next: (result: any) => {
          this.searchedVehicle = result.data.getVehicle;
          this.searchLoading = false;
        },
        error: (error) => {
          this.searchError = 'Vehicle not found';
          this.searchLoading = false;
          console.error(error);
        },
      });
  }

  // Feature 2
  // Load all vehicles for the dropdown
  loadAllVehicles(): void {
    this.apollo
      .query({
        query: GET_ALL_VEHICLES,
      })
      .subscribe({
        next: (result: any) => {
          this.vehicles = result.data.getAllVehicles.data.map((v: any) => ({
            label: `${v.first_name} ${v.last_name} - ${v.car_make} ${v.car_model} ${v.vin}`,
            value: v.vin,
            data: v,
          }));
        },
        error: (error) => {
          console.error('Error loading vehicles:', error);
        },
      });
  }

  // Feature 2
  // Handle the vehicle selection
  onVehicleSelect(event: any): void {
    const vin = event.value;
    if (!vin) {
      this.selectedVehicleRecords = [];
      return;
    }

    this.dropdownLoading = true;
    this.dropdownError = null;

    this.apollo
      .query({
        query: GET_RECORDS_BY_VIN,
        variables: { vin },
      })
      .subscribe({
        next: (result: any) => {
          this.selectedVehicleRecords = result.data.serviceRecordsByVin;
          this.dropdownLoading = false;
        },
        error: (error) => {
          this.dropdownError = 'Error loading service records';
          this.dropdownLoading = false;
          console.error(error);
        },
      });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }
}
