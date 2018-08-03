//// included by "vs/workbench/workbench.main.ts"

// Settings sections
import 'vs/workbench/parts/maix/config/browser/categoryContribution';
import 'vs/workbench/parts/maix/config/electron-browser/pathSettingsContribution';
import 'vs/workbench/parts/maix/config/common/openocdSettingsContribution';
import 'vs/workbench/parts/maix/config/common/flashSettingsContribution';
import 'vs/workbench/parts/maix/config/browser/internalSettingsCategoryContribution';
// Settings Page Patcher
import 'vs/workbench/parts/maix/patchSettings2/browser/settingsTreePathcer';
import 'vs/workbench/parts/maix/patchSettings2/browser/settingsPage2Pathcer';
// IO Config
import 'vs/workbench/parts/maix/fpioa-config/node/generateorContribution';
import 'vs/workbench/parts/maix/fpioa-config/electron-browser/fpioaContribution';
import 'vs/workbench/parts/maix/fpioa-config/common/packagings/includeAllContribution';
// Serial Devices
import 'vs/workbench/parts/maix/serialPort/electron-browser/panel/serialPanelContribution';
import 'vs/workbench/parts/maix/serialPort/electron-browser/panel/serialPanelService';
import 'vs/workbench/parts/maix/serialPort/common/reloadAction';
import 'vs/workbench/parts/maix/serialPort/common/monitorAction';
import 'vs/workbench/parts/maix/serialPort/common/configContribution';
import 'vs/workbench/parts/maix/serialPort/electron-browser/serialService';