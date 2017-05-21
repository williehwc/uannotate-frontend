import {Component, ViewChild} from '@angular/core';
import {AlertComponent, MODAL_DIRECTVES, BS_VIEW_PROVIDERS} from 'ng2-bootstrap/ng2-bootstrap';
import {ModalDirective} from 'ng2-bootstrap/components/modal/modal.component';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-invite',
	templateUrl: 'ua-invite.html',
  directives: [[AlertComponent, MODAL_DIRECTVES]],
  viewProviders: [BS_VIEW_PROVIDERS]
})


export class InviteComponent {
  alerts: Array<Object> = [];
  phenotateEmail: string = 'support-phenotate.org'.replace('-', '@');
  inviteCodes: Array<any> = [];
  inviteCode: string = null;
  inviteCodeID: number = null;
  inviteLinkCopied: boolean = false;

  @ViewChild('lgModal') public lgModal:ModalDirective;

  constructor(private _http: Http) {
    let scope = this;
    let finishListInviteCodes = function (data:any) {
      scope.inviteCodes = data.inviteCodes;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/prof/invite-code/list', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishListInviteCodes(data),
        err => console.log(err),
        () => console.log('Listed invite codes')
      );
  }
  generateInviteCode() {
    let scope = this;
    let finishGenerateInviteCode = function (data:any) {
      scope.inviteCodes.push(data);
      /*scope.alerts.push({
        type: 'success',
        msg: 'Share this invite code with a colleague: ' + data.inviteCode,
        closable: true
      });*/
      scope.inviteCode = data.inviteCode;
      scope.inviteCodeID = data.inviteCodeID;
      scope.lgModal.show();
    };
    this.alerts = [];
    this.inviteLinkCopied = false;
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/prof/invite-code/new', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishGenerateInviteCode(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Sorry, you don\'t have any invites left.',
          closable: true
        }),
        () => console.log('Generated invite code')
      );
  }
  removeInviteCode(inviteCodeID: number) {
    for (let i = 0; i < this.inviteCodes.length; i++) {
      if (this.inviteCodes[i].inviteCodeID === inviteCodeID)
        this.inviteCodes.splice(i, 1);
    }
    this.alerts = [];
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'inviteCodeID': inviteCodeID
    });
    this._http.post(globals.backendURL + '/restricted/prof/invite-code/remove', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => console.log(data),
        err => console.log(err),
        () => console.log('Generated invite code')
      );
  }
  assignInviteCode(inviteCode: string, inviteCodeID: number) {
    this.inviteCode = inviteCode;
    this.inviteCodeID = inviteCodeID;
    this.inviteLinkCopied = false;
  }
}
