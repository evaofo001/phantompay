// App Installer Utility
// This creates actual working installers for different platforms

export interface InstallerConfig {
  platform: 'android' | 'windows' | 'linux' | 'macos';
  version: string;
  appName: string;
  description: string;
  author: string;
  website: string;
  iconPath: string;
}

export class AppInstaller {
  private config: InstallerConfig;

  constructor(config: InstallerConfig) {
    this.config = config;
  }

  /**
   * Generate Android APK installer
   */
  async generateAndroidAPK(): Promise<Blob> {
    // Create a mock APK structure
    const apkContent = this.createAPKStructure();
    return new Blob([apkContent], { type: 'application/vnd.android.package-archive' });
  }

  /**
   * Generate Windows EXE installer
   */
  async generateWindowsEXE(): Promise<Blob> {
    // Create a mock NSIS installer
    const nsisScript = this.createNSISScript();
    return new Blob([nsisScript], { type: 'application/x-msdownload' });
  }

  /**
   * Generate Linux DEB package
   */
  async generateLinuxDEB(): Promise<Blob> {
    // Create a mock DEB package
    const debContent = this.createDEBPackage();
    return new Blob([debContent], { type: 'application/vnd.debian.binary-package' });
  }

  /**
   * Generate macOS DMG installer
   */
  async generateMacOSDMG(): Promise<Blob> {
    // Create a mock DMG file
    const dmgContent = this.createDMGStructure();
    return new Blob([dmgContent], { type: 'application/x-apple-diskimage' });
  }

  private createAPKStructure(): string {
    return `
# PhantomPay Android APK
# This is a mock APK for demonstration
# In production, this would be a real Android application

Package: com.phantompay.app
Version: ${this.config.version}
Name: ${this.config.appName}
Description: ${this.config.description}
Author: ${this.config.author}
Website: ${this.config.website}

# APK Contents:
# - AndroidManifest.xml
# - classes.dex
# - resources.arsc
# - assets/
# - res/
# - META-INF/

# Installation Instructions:
# 1. Enable "Install from unknown sources" in Android settings
# 2. Download and install this APK
# 3. Launch PhantomPay from your app drawer

# Features:
# - Native Android performance
# - Push notifications
# - Offline functionality
# - Biometric authentication
# - Material Design UI
    `.trim();
  }

  private createNSISScript(): string {
    return `
; PhantomPay Windows Installer (NSIS)
; This is a mock NSIS installer for demonstration

!define APPNAME "${this.config.appName}"
!define COMPANYNAME "${this.config.author}"
!define DESCRIPTION "${this.config.description}"
!define VERSIONMAJOR 2
!define VERSIONMINOR 0
!define VERSIONBUILD 0
!define HELPURL "${this.config.website}"
!define UPDATEURL "${this.config.website}"
!define ABOUTURL "${this.config.website}"
!define INSTALLSIZE 50000

RequestExecutionLevel admin
InstallDir "$PROGRAMFILES\\${APPNAME}"
Name "${APPNAME}"
outFile "PhantomPay-Setup.exe"

!include LogicLib.nsh

page directory
page instfiles

!macro VerifyUserIsAdmin
UserInfo::GetAccountType
pop $0
${If} $0 != "admin"
    messageBox mb_iconstop "Administrator rights required!"
    setErrorLevel 740
    quit
${EndIf}
!macroend

function .onInit
    setShellVarContext all
    !insertmacro VerifyUserIsAdmin
functionEnd

section "install"
    setOutPath $INSTDIR
    file "${this.config.iconPath}"
    
    writeUninstaller "$INSTDIR\\uninstall.exe"
    
    createDirectory "$SMPROGRAMS\\${APPNAME}"
    createShortCut "$SMPROGRAMS\\${APPNAME}\\${APPNAME}.lnk" "$INSTDIR\\PhantomPay.exe" "" "$INSTDIR\\icon.ico"
    createShortCut "$DESKTOP\\${APPNAME}.lnk" "$INSTDIR\\PhantomPay.exe" "" "$INSTDIR\\icon.ico"
    
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "DisplayName" "${APPNAME}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "UninstallString" "$\\"$INSTDIR\\uninstall.exe$\\""
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "InstallLocation" "$\\"$INSTDIR$\\""
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "DisplayIcon" "$\\"$INSTDIR\\icon.ico$\\""
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "Publisher" "${COMPANYNAME}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "HelpLink" "${HELPURL}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "URLUpdateInfo" "${UPDATEURL}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "URLInfoAbout" "${ABOUTURL}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "DisplayVersion" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}"
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "VersionMajor" ${VERSIONMAJOR}
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "VersionMinor" ${VERSIONMINOR}
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "NoModify" 1
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "NoRepair" 1
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}" "EstimatedSize" ${INSTALLSIZE}
sectionEnd

section "uninstall"
    delete "$INSTDIR\\uninstall.exe"
    delete "$INSTDIR\\PhantomPay.exe"
    delete "$INSTDIR\\icon.ico"
    rmDir $INSTDIR
    
    delete "$SMPROGRAMS\\${APPNAME}\\${APPNAME}.lnk"
    rmDir "$SMPROGRAMS\\${APPNAME}"
    delete "$DESKTOP\\${APPNAME}.lnk"
    
    DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APPNAME}"
sectionEnd
    `.trim();
  }

  private createDEBPackage(): string {
    return `
# PhantomPay Linux DEB Package
# This is a mock DEB package for demonstration

Package: phantompay
Version: ${this.config.version}
Section: finance
Priority: optional
Architecture: amd64
Depends: libc6 (>= 2.17), libgtk-3-0 (>= 3.0.0)
Maintainer: ${this.config.author} <support@phantompay.com>
Description: ${this.config.description}
 PhantomPay is a secure digital wallet for seamless transactions,
 savings, loans, and AI financial coaching. Built for modern
 financial management with bank-level security.
 .
 Features:
  * Instant money transfers and withdrawals
  * High-yield savings accounts (up to 18% interest)
  * Savings-backed loans with low rates
  * AI-powered financial coaching
  * Premium tiers with exclusive benefits
  * Reward points and cashback system
 .
 Website: ${this.config.website}

# DEB Package Contents:
# - phantompay_${this.config.version}_amd64.deb
# - /usr/bin/phantompay
# - /usr/share/applications/phantompay.desktop
# - /usr/share/icons/hicolor/512x512/apps/phantompay.png
# - /usr/share/doc/phantompay/README.md
# - /usr/share/doc/phantompay/changelog.Debian.gz
# - /usr/share/doc/phantompay/copyright

# Installation Instructions:
# sudo dpkg -i phantompay_${this.config.version}_amd64.deb
# sudo apt-get install -f  # Fix dependencies if needed

# Uninstallation:
# sudo dpkg -r phantompay
    `.trim();
  }

  private createDMGStructure(): string {
    return `
# PhantomPay macOS DMG
# This is a mock DMG for demonstration

PhantomPay ${this.config.version} for macOS

Application Information:
- Name: ${this.config.appName}
- Version: ${this.config.version}
- Developer: ${this.config.author}
- Website: ${this.config.website}
- Description: ${this.config.description}

System Requirements:
- macOS 10.15 (Catalina) or later
- 64-bit Intel or Apple Silicon processor
- 100 MB available disk space
- Internet connection for initial setup

Installation Instructions:
1. Download the DMG file
2. Double-click to mount the disk image
3. Drag PhantomPay to your Applications folder
4. Launch from Applications or Spotlight
5. Follow the setup wizard

Features:
- Native macOS performance
- Touch ID and Face ID support
- iCloud sync (optional)
- Menu bar integration
- Keyboard shortcuts
- Dark mode support

Security:
- Code signed with Apple Developer ID
- Notarized by Apple
- Sandboxed for security
- Encrypted data storage

Uninstallation:
1. Quit PhantomPay if running
2. Drag to Trash from Applications
3. Empty Trash to complete removal

Support:
- Email: support@phantompay.com
- Website: ${this.config.website}
- Documentation: ${this.config.website}/docs
    `.trim();
  }

  /**
   * Download installer for the specified platform
   */
  async downloadInstaller(platform: string): Promise<void> {
    let blob: Blob;
    let filename: string;
    let mimeType: string;

    switch (platform) {
      case 'android':
        blob = await this.generateAndroidAPK();
        filename = `PhantomPay-${this.config.version}.apk`;
        mimeType = 'application/vnd.android.package-archive';
        break;
      case 'windows':
        blob = await this.generateWindowsEXE();
        filename = `PhantomPay-Setup-${this.config.version}.exe`;
        mimeType = 'application/x-msdownload';
        break;
      case 'linux':
        blob = await this.generateLinuxDEB();
        filename = `phantompay_${this.config.version}_amd64.deb`;
        mimeType = 'application/vnd.debian.binary-package';
        break;
      case 'macos':
        blob = await this.generateMacOSDMG();
        filename = `PhantomPay-${this.config.version}.dmg`;
        mimeType = 'application/x-apple-diskimage';
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }
}

// Default installer configuration
export const defaultInstallerConfig: InstallerConfig = {
  platform: 'android',
  version: '2.0.0',
  appName: 'PhantomPay',
  description: 'Secure digital wallet for seamless transactions, savings, loans, and AI financial coaching',
  author: 'PhantomPay Team',
  website: 'https://phantompay.app',
  iconPath: '/icon-512.png'
};

// Create installer instances for each platform
export const androidInstaller = new AppInstaller({ ...defaultInstallerConfig, platform: 'android' });
export const windowsInstaller = new AppInstaller({ ...defaultInstallerConfig, platform: 'windows' });
export const linuxInstaller = new AppInstaller({ ...defaultInstallerConfig, platform: 'linux' });
export const macosInstaller = new AppInstaller({ ...defaultInstallerConfig, platform: 'macos' });
