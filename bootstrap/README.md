# Bootstrap

This section is used to bootstrap a new account, before any infrastructure exists.

This is currently a work in progress.

You must do the following manually, before attempting to run the scripts in this section:
- Login as the Account (root), and configure the following:
  - Turn on Access to Billing Information
  - Configure the Security Questions
  - Create Account-level X509 Certificates and CloudFront Keys
  - Enable MFA on the Account
  - Configure the Password Policy for 20 characters, 1 upper, 1 lower, 1 number minimum
  - Logout, then login and confirm MFA is active
- Create a BootStrapAdministrators Group, using the AdministratorAccess ManagedPolicy
- Create a bootstrapadministrator User, and make it a member of the BootstrapAdministrators Group
- Create an AccessKey for the bootstrapadministrator
- Create an ssh key using: "ssh-keygen -t rsa -b 4096 -C bootstrap@iropshub.com -f ~/.ssh/irops_administrator_id_rsa",
  giving this a secure passphrase
- Import the bootstrapadministrator SSH public key
- Create additional members of the BootstrapAdministrators Group, using the process above

Once the steps above have been created, we are ready to create an initial Bootstrap-LinuxBastion Instance,
which can then be used to install all remaining infrastructure and applications.
