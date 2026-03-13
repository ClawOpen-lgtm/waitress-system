import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { provideRouter, withComponentInputBinding } from '@angular/router';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([], withComponentInputBinding()),
    appConfig,
    HttpClientModule,
    FormsModule
  ]
}).catch((err) => console.error(err));
