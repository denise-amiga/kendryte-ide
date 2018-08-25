import { getSDKPath, getToolchainPath } from 'vs/workbench/parts/maix/_library/node/nodePath';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ConfigurationTarget, IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { Extensions as CategoryExtensions, IConfigCategoryRegistry } from 'vs/workbench/parts/maix/_library/common/type';
import { Extensions as ConfigurationExtensions, IConfigurationPropertySchema, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry';
import { Extensions as WorkbenchExtensions, IWorkbenchContribution, IWorkbenchContributionsRegistry } from 'vs/workbench/common/contributions';
import { Registry } from 'vs/platform/registry/common/platform';
import { LifecyclePhase } from 'vs/platform/lifecycle/common/lifecycle';
import { IEnvironmentService } from 'vs/platform/environment/common/environment';
import { readdirSync } from 'vs/base/node/extfs';
import { resolve } from 'path';

interface SettingsOverwiter<T> {
	(this: IEnvironmentService, old: T): T;
}

const configOverwrites: {[id: string]: SettingsOverwiter<any>} = {
	'cmake.generator'() {
		return 'Unix Makefiles';
	},
	'C_Cpp.default.includePath'() {
		const ret: string[] = [];
		const sdk = getSDKPath(this);
		if (sdk) {
			ret.push(sdk + '/include');
		}
		const toolchain = getToolchainPath(this);
		if (toolchain) {
			ret.push(resolve(toolchain, 'riscv64-unknown-elf/include'));

			const libgcc = resolve(toolchain, 'lib/gcc/riscv64-unknown-elf');
			const libgccVersion = readdirSync(libgcc)[0];
			ret.push(resolve(libgcc, libgccVersion, 'include'));

			const libcpp = resolve(toolchain, 'riscv64-unknown-elf/include/c++');
			const libcppVersion = readdirSync(libcpp)[0];
			ret.push(resolve(libcpp, libcppVersion));
			ret.push(resolve(libcpp, libcppVersion, 'riscv64-unknown-elf'));
		}
		return ret;
	},
};

class SettingCategoryContribution implements IWorkbenchContribution {
	private registry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);
	private categoryRegistry = Registry.as<IConfigCategoryRegistry>(CategoryExtensions.ConfigCategory);

	constructor(
		@IInstantiationService instantiationService: IInstantiationService,
		@IEnvironmentService private environmentService: IEnvironmentService,
		@IConfigurationService private configurationService: IConfigurationService,
	) {
		Object.keys(this.registry.getConfigurationProperties()).forEach((key: string) => this.checkCategory(key));
		this.registry.onDidRegisterConfiguration((keys: string[]) => keys.forEach(this.checkCategory, this));
	}

	private checkCategory(key: string) {
		const schema: IConfigurationPropertySchema = this.registry.getConfigurationProperties()[key];
		if (schema.hasOwnProperty('category')) {
			this.categoryRegistry.addSetting((schema as any).category, key);
		}
		const overwrite = configOverwrites[key];
		if (overwrite) {
			const old = this.configurationService.inspect(key);
			/// if (!old.user) {
			const value = overwrite.call(this.environmentService, old.user || old.default);
			if (typeof value !== 'undefined') {
				this.configurationService.updateValue(key, value, ConfigurationTarget.USER);
			}
			/// }
		}

		if (key === 'files.exclude') {
			this.hideBuildDirectory();
		}
	}

	private hideBuildDirectory() {
		const inspect = this.configurationService.inspect<any>('files.exclude');
		let data = inspect.user? { ...inspect.user } : { ...inspect.default };
		let changed = { change: false };

		ignore(data, '.idea', changed);
		ignore(data, 'config/fpioa.cfg', changed);
		if (this.environmentService.isBuilt) {
			for (const part of ['CMakeCache.txt', 'CMakeFiles', 'cmake_install.cmake', 'CMakeLists.txt', 'compile_commands.json', 'Makefile']) {
				ignore(data, 'build/' + part, changed);
			}
		}
		if (changed.change) {
			this.configurationService.updateValue('files.exclude', data, ConfigurationTarget.USER);
		}
	}
}

function ignore(data: any, name: string, changed: {change: boolean}) {
	if (!data.hasOwnProperty(name)) {
		changed.change = true;
		data[name] = true;
	}
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
        .registerWorkbenchContribution(SettingCategoryContribution, LifecyclePhase.Running);
