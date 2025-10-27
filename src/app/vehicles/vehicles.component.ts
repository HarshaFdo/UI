import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { vehicle } from './Vehilces.model';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { VehiclesService } from '../services/vehicles.serivce';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputNumberModule,
    FormsModule,
    InputTextModule,
    HttpClientModule,
  ],
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.scss'],
})
export class VehiclesComponent implements OnInit {
  inputValue: number = 0;
  vehicles: vehicle[] = [];
  totalRecords: number = 0;
  currentPage: number = 1;
  searchText: string = '';

  constructor(
    private vehiclesService: VehiclesService,
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.vehiclesService.getAllVehicles(this.currentPage, 100).subscribe({
      next: (response) => {
        this.vehicles = response.data;
        this.totalRecords = response.total;
        console.log('Vehicles loaded:', this.vehicles);
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
      },
    });
  }

  loadVehiclesLazy(event: any): void {
    const page = Math.floor(event.first / event.rows) + 1;
    this.currentPage = page;
    this.loadVehicles();
  }

  onSearch(): void {
    if (this.searchText && this.searchText.trim()) {
      const searchPattern = this.searchText + '*';
      this.vehiclesService
        .searchVehicles(searchPattern, this.currentPage, 100)
        .subscribe({
          next: (response) => {
            this.vehicles = response.data;
            this.totalRecords = response.total;
            console.log('Search results:', this.vehicles);
          },
          error: (error) => {
            console.error('Error searching vehicles:', error);
          },
        });
    } else {
      // If search is empty, reload all vehicles.
      this.loadVehicles();
    }
  }

  submitValue(): void {
    const { sessionHash, userId } = this.notificationService.getSessionInfo();
    console.log('Exporting with:', { minAge: this.inputValue, sessionHash, userId });
    if (!sessionHash || !userId) {
      console.error('Missing sessionHash or userId');
      return;
    }

    this.http
      .post('http://localhost:3000/vehicle/export', {
        minAge: this.inputValue,
        sessionHash,
        userId: userId,
      })
      .subscribe({
        next: (response) => {
          console.log('Export job queued:', response);
        },
        error: (error) => {
          console.error('Error exporting:', error);
        },
      });
  }

  openFileUploader() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadFile(file);
      }
    };

    input.click();
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    console.log('Uploading file:', file.name);

    this.http.post('http://localhost:3000/vehicle/import', formData).subscribe({
      next: (response) => {
        console.log('Upload successful:', response);
        setTimeout(() => this.loadVehicles(), 2000);
      },
      error: (error) => {
        console.error('Error uploading:', error);
      },
    });
  }
}
