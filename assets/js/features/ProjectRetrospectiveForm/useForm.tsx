import * as React from "react";
import * as Projects from "@/models/projects";
import * as TipTapEditor from "@/components/Editor";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { Paths } from "@/routes/paths";

interface Error {
  field: string;
  message: string;
}

interface FormOptions {
  project?: Projects.Project;
  retrospective?: Projects.ProjectRetrospective;
  mode: "create" | "edit";
}
export interface FormState {
  project?: Projects.Project;
  mode: "create" | "edit";

  errors: Error[];

  whatWentWell: TipTapEditor.EditorState;
  whatCouldHaveGoneBetter: TipTapEditor.EditorState;
  whatDidYouLearn: TipTapEditor.EditorState;

  submit: () => void;
  submittable: boolean;
}

export function useForm(options: FormOptions): FormState {
  const [errors, setErrors] = React.useState<Error[]>([]);

  const whatWentWell = useWhatWentWellEditor(options);
  const whatCouldHaveGoneBetter = useWhatCouldHaveGoneBetterEditor(options);
  const whatDidYouLearn = useWhatDidYouLearnEditor(options);

  const redirect = useNavigateTo(
    options.mode === "create"
      ? Paths.projectPath(options.project!.id!)
      : Paths.projectRetrospectivePath(options.retrospective!.project!.id!),
  );

  const [post, { loading: posting }] = Projects.useCloseProject();
  const [edit, { loading: editing }] = Projects.useEditProjectRetrospective();
  const loading = posting || editing;

  const submit = async () => {
    if (!submittable) return false;

    const errors = validate(whatWentWell, whatCouldHaveGoneBetter, whatDidYouLearn);
    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    if (options.mode == "create") {
      await post({
        projectId: options.project!.id,
        retrospective: JSON.stringify({
          whatWentWell: whatWentWell.editor.getJSON(),
          whatCouldHaveGoneBetter: whatCouldHaveGoneBetter.editor.getJSON(),
          whatDidYouLearn: whatDidYouLearn.editor.getJSON(),
        }),
      });
    } else {
      await edit({
        id: options.retrospective!.id,
        content: JSON.stringify({
          whatWentWell: whatWentWell.editor.getJSON(),
          whatCouldHaveGoneBetter: whatCouldHaveGoneBetter.editor.getJSON(),
          whatDidYouLearn: whatDidYouLearn.editor.getJSON(),
        }),
      });
    }

    redirect();

    return true;
  };

  const submittable =
    !loading && whatWentWell.submittable && whatCouldHaveGoneBetter.submittable && whatDidYouLearn.submittable;

  return {
    project: options.project,
    mode: options.mode,
    errors,
    whatWentWell,
    whatCouldHaveGoneBetter,
    whatDidYouLearn,

    submit,
    submittable,
  };
}

function useWhatWentWellEditor(options: FormOptions) {
  return TipTapEditor.useEditor({
    placeholder: `Write your answer here...`,
    className: "min-h-[250px] py-2 font-medium",
    content: findExistingContent(options, "whatWentWell"),
  });
}

function useWhatCouldHaveGoneBetterEditor(options: FormOptions) {
  return TipTapEditor.useEditor({
    placeholder: `Write your answer here...`,
    className: "min-h-[250px] py-2 font-medium",
    content: findExistingContent(options, "whatCouldHaveGoneBetter"),
  });
}

function useWhatDidYouLearnEditor(options: FormOptions) {
  return TipTapEditor.useEditor({
    placeholder: `Write your answer here...`,
    className: "min-h-[250px] py-2 font-medium",
    content: findExistingContent(options, "whatDidYouLearn"),
  });
}

function validate(
  whatWentWell: TipTapEditor.EditorState,
  whatCouldHaveGoneBetter: TipTapEditor.EditorState,
  whatDidYouLearn: TipTapEditor.EditorState,
): Error[] {
  let errors: Error[] = [];

  if (isContentEmpty(whatWentWell.editor.getJSON())) {
    errors.push({ field: "whatWentWell", message: "is required" });
  }

  if (isContentEmpty(whatCouldHaveGoneBetter.editor.getJSON())) {
    errors.push({ field: "whatCouldHaveGoneBetter", message: "is required" });
  }

  if (isContentEmpty(whatDidYouLearn.editor.getJSON())) {
    errors.push({ field: "whatDidYouLearn", message: "is required" });
  }

  return errors;
}

function findExistingContent(
  options: FormOptions,
  key: "whatWentWell" | "whatCouldHaveGoneBetter" | "whatDidYouLearn",
) {
  if (options.mode === "edit" && options.retrospective?.content) {
    const content = JSON.parse(options.retrospective.content);

    if (content[key]) {
      return content[key];
    }
  }
}
