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
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';

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
    DialogModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
    CardModule,
  ],
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.scss'],
})
export class VehiclesComponent implements OnInit {
  inputValue: number = 0;
  vehicles: vehicle[] = [];
  filteredVehiclesPreview: vehicle[] = [];
  totalRecords: number = 0;
  currentPage: number = 1;
  searchText: string = '';

  loading = false;
  saving = false;

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
    if (this.inputValue <= 0) {
      alert('Pleaseenter a valid age filter');
      return;
    }

    // Fetch thre preview data
    this.vehiclesService.searchByAge(this.inputValue).subscribe({
      next: (vehicles) => {
        this.filteredVehiclesPreview = vehicles;
        if (vehicles.lenght === 0) {
          alert('No vehicles found matching this age filter');
        }
      },
      error: (error) => {
        console.error('Error fetching preview:', error);
      },
    });
  }

  confirmExport(): void {
    const { sessionHash, userId } = this.notificationService.getSessionInfo();
    console.log('Exporting with:', {
      minAge: this.inputValue,
      sessionHash,
      userId,
    });
    if (!sessionHash || !userId) {
      console.error('Missing sessionHash or userId');
      return;
    }

    this.http
      .post('http://localhost:3003/vehicle/export', {
        minAge: this.inputValue,
        sessionHash,
        userId: userId,
      })
      .subscribe({
        next: (response) => {
          console.log('Export job queued:', response);
          this.cancelPreview(); // after the export close the priview
        },
        error: (error) => {
          console.error('Error exporting:', error);
        },
      });
  }

  cancelPreview(): void {
    this.filteredVehiclesPreview = [];
    this.inputValue = 0;
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

    this.http.post('http://localhost:3003/vehicle/import', formData).subscribe({
      next: (response) => {
        console.log('Upload successful:', response);
        setTimeout(() => this.loadVehicles(), 2000);
      },
      error: (error) => {
        console.error('Error uploading:', error);
      },
    });
  }

  displayEditDialog: boolean = false;
  selectedVehicle: vehicle | null = null;

  editVehicle(vehicle: vehicle): void {
    this.selectedVehicle = { ...vehicle };
    this.displayEditDialog = true;
  }

  saveVehicle(): void {
    if (!this.selectedVehicle) return;

    this.vehiclesService
      .updateVehicle(this.selectedVehicle.vin, {
        first_name: this.selectedVehicle.first_name,
        last_name: this.selectedVehicle.last_name,
        email: this.selectedVehicle.email,
        car_make: this.selectedVehicle.car_make,
        car_model: this.selectedVehicle.car_model,
      })
      .subscribe({
        next: () => {
          console.log('Vehicle updated successfully');
          this.displayEditDialog = false;
          this.loadVehicles(); // Refresh table
        },
        error: (error) => {
          console.error('Error updating vehicle:', error);
        },
      });
  }

  deleteVehicle(vehicle: vehicle): void {
    if (confirm(`Are you sure you want to delete vehicle ${vehicle.vin}?`)) {
      this.vehiclesService.deleteVehicle(vehicle.vin).subscribe({
        next: () => {
          console.log('Vehicle deleted successfully');
          this.loadVehicles(); // Refresh table
        },
        error: (error) => {
          console.error('Error deleting vehicle:', error);
        },
      });
    }
  }
}
