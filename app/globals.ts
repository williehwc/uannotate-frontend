import {Headers, RequestOptions} from '@angular/http';

export var backendURL = 'http://52.186.121.47:4000';
export var omimURL = 'http://omim.org/entry/';
export var ordoURL = 'http://www.orpha.net/consor/cgi-bin/OC_Exp.php?Expert=';
export var domainName = 'phenotate.org';
export var headers = new Headers({ 'Content-Type': 'application/json' });
export var options = new RequestOptions({ headers: headers });
