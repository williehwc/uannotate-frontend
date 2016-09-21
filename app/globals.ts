import {Headers, RequestOptions} from '@angular/http';

export var backendURL = 'http://52.186.121.47:3000';
export var omimURL = 'http://omim.org/entry/';
export var domainName = 'http://phenotate.org/';
export var headers = new Headers({ 'Content-Type': 'application/json' });
export var options = new RequestOptions({ headers: headers });
