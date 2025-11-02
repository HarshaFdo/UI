import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { GraphQLModule } from './grapgh.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(GraphQLModule, ToolbarModule, ButtonModule),
  ],
};
