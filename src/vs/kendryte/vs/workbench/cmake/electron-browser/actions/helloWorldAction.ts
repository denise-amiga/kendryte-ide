import { Action } from 'vs/base/common/actions';
import { IOutputChannel, IOutputService } from 'vs/workbench/contrib/output/common/output';
import { INotificationService } from 'vs/platform/notification/common/notification';
import { ACTION_ID_MAIX_CMAKE_HELLO_WORLD, ACTION_LABEL_MAIX_CMAKE_HELLO_WORLD } from 'vs/kendryte/vs/workbench/cmake/common/actionIds';
import { INodePathService } from 'vs/kendryte/vs/services/path/common/type';
import { CMAKE_CHANNEL, ICMakeService } from 'vs/kendryte/vs/workbench/cmake/common/type';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { fileExists, mkdirp, unlink } from 'vs/base/node/pfs';
import { ACTIVE_GROUP, IEditorService } from 'vs/workbench/services/editor/common/editorService';
import { INodeFileSystemService } from 'vs/kendryte/vs/services/fileSystem/common/type';
import { IExecutableProject } from 'vs/kendryte/vs/base/common/jsonSchemas/cmakeConfigSchema';
import { resolvePath } from 'vs/kendryte/vs/base/common/resolvePath';
import { assertNotNull } from 'vs/kendryte/vs/base/common/assertNotNull';
import { IKendryteWorkspaceService } from 'vs/kendryte/vs/services/workspace/common/type';
import { copyPreserve } from 'vs/kendryte/vs/base/node/copyPreserve';
import { CMAKE_CONFIG_FILE_NAME } from 'vs/kendryte/vs/base/common/constants/wellknownFiles';

export class MaixCMakeHelloWorldAction extends Action {
	public static readonly ID = ACTION_ID_MAIX_CMAKE_HELLO_WORLD;
	public static readonly LABEL = ACTION_LABEL_MAIX_CMAKE_HELLO_WORLD;
	protected outputChannel: IOutputChannel;

	constructor(
		id = MaixCMakeHelloWorldAction.ID, label = MaixCMakeHelloWorldAction.LABEL,
		@ICMakeService protected cmakeService: ICMakeService,
		@IOutputService protected outputService: IOutputService,
		@IWorkspaceContextService protected workspaceContextService: IWorkspaceContextService,
		@INotificationService protected notificationService: INotificationService,
		@INodePathService protected nodePathService: INodePathService,
		@IEditorService protected editorService: IEditorService,
		@INodeFileSystemService protected nodeFileSystemService: INodeFileSystemService,
		@IKendryteWorkspaceService private readonly kendryteWorkspaceService: IKendryteWorkspaceService,
	) {
		super(id, label);
		this.outputChannel = assertNotNull(outputService.getChannel(CMAKE_CHANNEL));
	}

	_run(): Promise<void> {
		const p = this.run();
		p.then(undefined, (e) => {
			this.outputChannel.append(`${e.stack}\n`);
			this.outputService.showChannel(CMAKE_CHANNEL);
		});
		return p;
	}

	async run(): Promise<void> {
		this.outputChannel.clear();

		await this.cmakeService.rescanCurrentFolder();

		await mkdirp(this.kendryteWorkspaceService.requireCurrentWorkspaceFile('.vscode'));

		const source = this.nodePathService.getPackagesPath('hello-world-project');
		const target = this.kendryteWorkspaceService.requireCurrentWorkspace();
		this.outputChannel.append(`copy from: ${source} to ${target}\n`);
		await copyPreserve(source, target);

		const installOkFile = resolvePath(target, '.install-ok');
		if (await fileExists(installOkFile)) {
			await unlink(installOkFile).catch();
		}

		// this is official package, just ignore any error
		const packageData = await this.kendryteWorkspaceService.readProjectSetting(target) as IExecutableProject;

		const resolver = this.workspaceContextService.getWorkspace().folders[0];

		const i1 = this.editorService.createInput({ resource: resolver.toResource(CMAKE_CONFIG_FILE_NAME) });
		await this.editorService.openEditor(assertNotNull(i1), { pinned: true }, ACTIVE_GROUP);
		if (packageData.entry) {
			const i2 = this.editorService.createInput({ resource: resolver.toResource(packageData.entry) });
			await this.editorService.openEditor(assertNotNull(i2), { pinned: true }, ACTIVE_GROUP);
		}

		await this.cmakeService.rescanCurrentFolder();

		this.outputChannel.append(`start cmake configure\n`);
		this.cmakeService.configure().catch();
	}
}
