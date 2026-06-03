import { getNonDeletedElements } from "@albertBuenaventura/element";
import { LinearElementEditor } from "@albertBuenaventura/element";
import { isLinearElement, isTextElement } from "@albertBuenaventura/element";

import { arrayToMap, KEYS } from "@albertBuenaventura/common";

import { selectGroupsForSelectedElements } from "@albertBuenaventura/element";

import { CaptureUpdateAction } from "@albertBuenaventura/element";

import type { ExcalidrawElement } from "@albertBuenaventura/element/types";

import { selectAllIcon } from "../components/icons";

import { register } from "./register";

export const actionSelectAll = register({
  name: "selectAll",
  label: "labels.selectAll",
  icon: selectAllIcon,
  trackEvent: { category: "canvas" },
  viewMode: false,
  perform: (elements, appState, value, app) => {
    if (appState.selectedLinearElement?.isEditing) {
      return false;
    }

    const selectedElementIds = elements
      .filter(
        (element) =>
          !element.isDeleted &&
          !(isTextElement(element) && element.containerId) &&
          !element.locked,
      )
      .reduce((map: Record<ExcalidrawElement["id"], true>, element) => {
        map[element.id] = true;
        return map;
      }, {});

    return {
      appState: {
        ...appState,
        ...selectGroupsForSelectedElements(
          {
            editingGroupId: null,
            selectedElementIds,
          },
          getNonDeletedElements(elements),
          appState,
          app,
        ),
        selectedLinearElement:
          // single linear element selected
          Object.keys(selectedElementIds).length === 1 &&
          isLinearElement(elements[0])
            ? new LinearElementEditor(elements[0], arrayToMap(elements))
            : null,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.A,
});
