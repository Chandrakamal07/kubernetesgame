import test from 'node:test';
import assert from 'node:assert/strict';
import { chapter01Missions } from './chapter01.ts';

test('Mission Completeness & Beginner Learning Validator', async (t) => {
  const taughtConcepts = new Set<string>();
  const taughtImages = new Set<string>();
  const taughtManifests = new Set<string>();

  await t.test('Every mission explicitly provides or has already taught all required inputs', () => {
    for (const mission of chapter01Missions) {
      // Record concepts taught in this lesson
      mission.teach.concepts.forEach((c) => taughtConcepts.add(c.term.toLowerCase()));

      const rule = mission.completionRule;
      const requiredInputs = mission.goal.requiredInputs || [];
      const requiredValues = requiredInputs.map((i) => i.value.toLowerCase());

      // If mission requires an image (e.g. nginx, redis)
      if (rule.image) {
        const imageReq = rule.image.toLowerCase();
        const isExplicitlyProvided = requiredValues.some((v) => v.includes(imageReq));
        const wasPreviouslyTaught = taughtImages.has(imageReq);

        assert.ok(
          isExplicitlyProvided || wasPreviouslyTaught,
          `Mission "${mission.id}" (${mission.title}) requires container image "${rule.image}" but does not explicitly state it in requiredInputs and was not taught in a previous lesson!`
        );

        taughtImages.add(imageReq);
      }

      // If mission requires a Pod name
      if (rule.podName) {
        const podReq = rule.podName.toLowerCase();
        const isExplicitlyProvided = requiredValues.some((v) => v.includes(podReq));

        assert.ok(
          isExplicitlyProvided,
          `Mission "${mission.id}" (${mission.title}) requires Pod name "${rule.podName}" but does not provide it in goal.requiredInputs!`
        );
      }

      // If mission requires a YAML manifest file
      if (rule.manifestFile) {
        const manifestReq = rule.manifestFile.toLowerCase();
        const isExplicitlyProvided = requiredValues.some((v) => v.includes(manifestReq));

        assert.ok(
          isExplicitlyProvided,
          `Mission "${mission.id}" (${mission.title}) requires manifest "${rule.manifestFile}" but does not provide it in goal.requiredInputs!`
        );

        taughtManifests.add(manifestReq);
      }

      // Verify guided command segments match full command
      if (mission.guidedCommand) {
        const fullCmd = mission.guidedCommand.fullCommand;
        const segmentTokens = mission.guidedCommand.segments.map((s) => s.token).join(' ');
        assert.ok(
          fullCmd.length > 0 && segmentTokens.length > 0,
          `Mission "${mission.id}" guided command segments cannot be empty.`
        );
      }

      // Verify review takeaways exist
      assert.ok(
        mission.review.keyTakeaway.length > 0,
        `Mission "${mission.id}" must contain a keyTakeaway in review.`
      );
    }
  });

  await t.test('Lesson 2 explicitly teaches nginx image before Lesson 3 requires it', () => {
    const lesson2 = chapter01Missions.find((m) => m.id === 'lesson-2');
    const lesson3 = chapter01Missions.find((m) => m.id === 'lesson-3');

    assert.ok(lesson2, 'Lesson 2 must exist in curriculum.');
    assert.ok(lesson3, 'Lesson 3 must exist in curriculum.');

    const lesson2MentionsNginx =
      lesson2.teach.summary.toLowerCase().includes('nginx') ||
      lesson2.teach.concepts.some((c) => c.term.toLowerCase().includes('nginx')) ||
      lesson2.goal.requiredInputs.some((i) => i.value.toLowerCase().includes('nginx'));

    assert.ok(
      lesson2MentionsNginx,
      'Lesson 2 must teach the nginx container image concept before Lesson 3 uses it.'
    );
  });
});
