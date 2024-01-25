import React from "react";

import * as People from "@/graphql/People";
import * as Updates from "@/graphql/Projects/updates";
import * as Icons from "@tabler/icons-react";

import { useAddReaction } from "./useAddReaction";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
import * as Feed from "@/features/feed";
import * as TipTapEditor from "@/components/Editor";
import Button from "@/components/Button";

import { useBoolState } from "@/utils/useBoolState";

export function CommentSection({
  update,
  refetch,
  me,
}: {
  update: Updates.Update;
  refetch: () => void;
  me: People.Person;
}) {
  const { beforeAck, afterAck } = Updates.splitCommentsBeforeAndAfterAck(update);

  return (
    <>
      <div className="text-content-accent font-extrabold pb-2">Comments</div>
      <div className="flex flex-col">
        {beforeAck.map((c) => (
          <Comment key={c.id} comment={c} refetch={refetch} />
        ))}

        <AckComment update={update} />

        {afterAck.map((c) => (
          <Comment key={c.id} comment={c} refetch={refetch} />
        ))}

        <CommentBox update={update} refetch={refetch} me={me} />
      </div>
    </>
  );
}

function Comment({ comment, refetch }) {
  const addReactionForm = useAddReaction(comment.id, "comment", refetch);
  const testId = "comment-" + comment.id;

  return (
    <div
      className="flex items-start justify-between gap-3 py-3 border-t border-stroke-base text-content-accent px-3"
      data-test-id={testId}
    >
      <div className="shrink-0">
        <Avatar person={comment.author} size="tiny" />
      </div>

      <div className="flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-bold -mt-0.5">{comment.author.fullName}</div>
            <span className="text-content-dimmed text-sm">
              <FormattedTime time={comment.insertedAt} format="relative" />
            </span>
          </div>
        </div>

        <div className="my-1">
          <RichContent jsonContent={JSON.parse(comment.message)} />
        </div>

        <Feed.Reactions reactions={comment.reactions} size={20} form={addReactionForm} />
      </div>
    </div>
  );
}

function AckComment({ update }) {
  if (!update.acknowledged) return null;

  const person = update.acknowledgingPerson;

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-3 text-content-accent bg-green-400/10">
      <div className="shrink-0">
        <Icons.IconCircleCheckFilled size={20} className="text-green-400" />
      </div>

      <div className="flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>{person.fullName} acknowledged this update</div>
            <span className="text-content-base text-sm">
              <FormattedTime time={update.acknowledgedAt} format="relative" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentBox({ update, refetch, me }) {
  const [active, _, activate, deactivate] = useBoolState(false);

  const onPost = () => {
    deactivate();
    refetch();
  };

  if (active) {
    return <AddCommentActive me={me} update={update} onBlur={deactivate} onPost={onPost} />;
  } else {
    return <AddCommentNonActive onClick={activate} me={me} />;
  }
}

function AddCommentNonActive({ onClick, me }) {
  return (
    <div
      className="py-3 border-t border-stroke-base cursor-pointer flex items-center gap-3 px-3"
      data-test-id="add-comment"
      onClick={onClick}
    >
      <Avatar person={me} size="tiny" />
      Post a comment...
    </div>
  );
}

function AddCommentActive({ me, update, onBlur, onPost }) {
  const peopleSearch = People.usePeopleSearch();

  const { editor, submittable } = TipTapEditor.useEditor({
    placeholder: "Post a comment...",
    peopleSearch: peopleSearch,
    className: "min-h-[200px] p-4",
  });

  const [post, { loading }] = Updates.usePostComment();

  const handlePost = async () => {
    if (!editor) return;
    if (!submittable) return;
    if (loading) return;

    await post({
      variables: {
        input: {
          updateId: update.id,
          content: JSON.stringify(editor.getJSON()),
        },
      },
    });

    await onPost();
  };

  return (
    <TipTapEditor.Root editor={editor}>
      <div className="border-t border-stroke-base pl-4 py-4 text-content-accent flex items-start gap-4">
        <Avatar person={me} size="tiny" />

        <div className="border-x border-b border-stroke-base flex-1">
          <TipTapEditor.Toolbar editor={editor} />
          <TipTapEditor.EditorContent editor={editor} />

          <div className="flex justify-between items-center m-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePost}
                loading={loading}
                variant="success"
                data-test-id="post-comment"
                size="small"
                disabled={!submittable}
              >
                {submittable ? "Post" : "Uploading..."}
              </Button>

              <Button variant="secondary" onClick={onBlur} size="small">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TipTapEditor.Root>
  );
}
