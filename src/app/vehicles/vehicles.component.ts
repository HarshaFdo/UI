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
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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
    ToastModule,
  ],
  providers: [MessageService],
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
    private notificationService: NotificationService,
    private messageService: MessageService // Inject MessageService
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading = true;
    this.vehiclesService.getAllVehicles(this.currentPage, 100).subscribe({
      next: (response) => {
        this.vehicles = response.data;
        this.totalRecords = response.total;
        this.loading = false;
        console.log('Vehicles loaded:', this.vehicles);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading vehicles:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load vehicles',
          life: 3000,
        });
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
      this.loading = true;
      this.vehiclesService
        .searchVehicles(searchPattern, this.currentPage, 100)
        .subscribe({
          next: (response) => {
            this.vehicles = response.data;
            this.totalRecords = response.total;
            this.loading = false;
            console.log('Search results:', this.vehicles);

            if (response.data.length === 0) {
              this.messageService.add({
                severity: 'info',
                summary: 'No Results',
                detail: 'No vehicles found matching your search',
                life: 3000,
              });
            }
          },
          error: (error) => {
            this.loading = false;
            console.error('Error searching vehicles:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Search Failed',
              detail: 'Error searching vehicles',
              life: 3000,
            });
          },
        });
    } else {
      this.loadVehicles();
    }
  }

  submitValue(): void {
    // Validate input
    if (this.inputValue === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Input',
        detail: 'Please enter a valid age filter',
        life: 3000,
      });
      return;
    }

    // Fetch the preview data
    this.vehiclesService.searchByAge(this.inputValue).subscribe({
      next: (vehicles) => {
        this.filteredVehiclesPreview = vehicles;

        if (vehicles.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'No Records Found',
            detail: `No vehicles found with age ≥ ${this.inputValue} years. Please try a different value.`,
            life: 5000,
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Preview Ready',
            detail: `Found ${vehicles.length} vehicle(s) matching your criteria`,
            life: 3000,
          });
        }
      },
      error: (error) => {
        console.error('Error fetching preview:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch preview data',
          life: 3000,
        });
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
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: 'Session information is missing',
        life: 3000,
      });
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
          this.cancelPreview();
        },
        error: (error) => {
          console.error('Error exporting:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Export Failed',
            detail: 'Failed to export vehicles',
            life: 3000,
          });
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
        this.messageService.add({
          severity: 'success',
          summary: 'Upload Successful',
          detail: `${file.name} uploaded successfully`,
          life: 3000,
        });
        setTimeout(() => this.loadVehicles(), 2000);
      },
      error: (error) => {
        console.error('Error uploading:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: 'Failed to upload file',
          life: 3000,
        });
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

    this.saving = true;
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
          this.saving = false;
          this.displayEditDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Update Successful',
            detail: 'Vehicle updated successfully',
            life: 3000,
          });
          this.loadVehicles();
        },
        error: (error) => {
          console.error('Error updating vehicle:', error);
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: 'Failed to update vehicle',
            life: 3000,
          });
        },
      });
  }

  deleteVehicle(vehicle: vehicle): void {
    if (confirm(`Are you sure you want to delete vehicle ${vehicle.vin}?`)) {
      this.vehiclesService.deleteVehicle(vehicle.vin).subscribe({
        next: () => {
          console.log('Vehicle deleted successfully');
          this.messageService.add({
            severity: 'success',
            summary: 'Delete Successful',
            detail: 'Vehicle deleted successfully',
            life: 3000,
          });
          this.loadVehicles();
        },
        error: (error) => {
          console.error('Error deleting vehicle:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: 'Failed to delete vehicle',
            life: 3000,
          });
        },
      });
    }
  }
}
