import {Headers, RequestOptions} from '@angular/http';

export var backendURL = 'http://bitnami-nodejs-193d.cloudapp.net';
export var omimURL = 'http://omim.org/entry/';
export var headers = new Headers({ 'Content-Type': 'application/json' });
export var options = new RequestOptions({ headers: headers });
