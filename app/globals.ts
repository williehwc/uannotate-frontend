import {Headers, RequestOptions} from '@angular/http';

export var backendURL = 'https://uannotate-backend-williehwc.c9users.io';
export var headers = new Headers({ 'Content-Type': 'application/json' });
export var options = new RequestOptions({ headers: headers });
