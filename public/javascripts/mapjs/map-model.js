/*jslint forin: true, nomen: true*/
/*global _, MAPJS, observable*/
MAPJS.MapModel = function (layoutCalculator, titlesToRandomlyChooseFrom, intermediaryTitlesToRandomlyChooseFrom) {
	'use strict';
	titlesToRandomlyChooseFrom = titlesToRandomlyChooseFrom || ['double click to edit'];
	intermediaryTitlesToRandomlyChooseFrom = intermediaryTitlesToRandomlyChooseFrom || titlesToRandomlyChooseFrom;
	var self = this,
		analytic,
		content_change,
		validationFn,
		currentLayout = {
			nodes: {},
			connectors: {}
		},
		idea,
		isInputEnabled = true,
		isCurrentlyEdited = false,
		isEditOldEnabled = true,
		isEditingEnabled = true,
		loading = false,
		uid = null,
		currentlySelectedIdeaId,
		activatedNodes = [],
		revertSelectionForUndo,
		revertActivatedForUndo,
		setActiveNodes = function (activated) {
			var wasActivated = _.clone(activatedNodes);
			activatedNodes = activated;
			self.dispatchEvent('activatedNodesChanged', _.difference(activatedNodes, wasActivated), _.difference(wasActivated, activatedNodes));
		},
		getRandomTitle = function (titles) {
			return titles[Math.floor(titles.length * Math.random())];
		},
		horizontalSelectionThreshold = 300,
		moveNodes = function (nodes, deltaX, deltaY) {
			if (deltaX || deltaY) {
				_.each(nodes, function (node) {
					node.x += deltaX;
					node.y += deltaY;
					self.dispatchEvent('nodeMoved', node);
				});
			}
		},
		isAddLinkMode,
		updateCurrentLayout = function (newLayout) {
			var nodeId, newNode, oldNode, newConnector, oldConnector, linkId, newLink, oldLink;
			var reposDetected = false;
			for (nodeId in currentLayout.connectors) {
				newConnector = newLayout.connectors[nodeId];
				oldConnector = currentLayout.connectors[nodeId];
				if (!newConnector || newConnector.from !== oldConnector.from || newConnector.to !== oldConnector.to) {
					self.dispatchEvent('connectorRemoved', oldConnector);
				}
			}
			for (nodeId in currentLayout.nodes) {
				oldNode = currentLayout.nodes[nodeId];
				newNode = newLayout.nodes[nodeId];
				if (!newNode) {
					/*jslint eqeq: true*/
					if (nodeId == currentlySelectedIdeaId) {
						self.selectNode(nodeId);
					}
					self.dispatchEvent('nodeRemoved', oldNode, nodeId);
				}
			}
			for (nodeId in newLayout.nodes) {
				oldNode = currentLayout.nodes[nodeId];
				newNode = newLayout.nodes[nodeId];
				if (!currentlySelectedIdeaId && newNode.isSelected) {
					self.selectNode(newNode.id, true);
					//currentlySelectedIdeaId = newNode.id;
				}
				if (!oldNode) {
					self.dispatchEvent('nodeCreated', newNode);
					reposDetected = true;
				} else {
					if (newNode.x !== oldNode.x || newNode.y !== oldNode.y) {
						self.dispatchEvent('nodeMoved', newNode);
						reposDetected = true;
					}
					if (newNode.title !== oldNode.title) {
						reposDetected = true;
						self.dispatchEvent('nodeTitleChanged', newNode);
					}
					if (!_.isEqual(newNode.attr || {}, oldNode.attr || {})) {
						self.dispatchEvent('nodeAttrChanged', newNode);
					}
				}
			}
			for (nodeId in newLayout.connectors) {
				newConnector = newLayout.connectors[nodeId];
				oldConnector = currentLayout.connectors[nodeId];
				if (!oldConnector || newConnector.from !== oldConnector.from || newConnector.to !== oldConnector.to) {
					self.dispatchEvent('connectorCreated', newConnector);
				}
			}
			for (linkId in newLayout.links) {
				newLink = newLayout.links[linkId];
				oldLink = currentLayout.links && currentLayout.links[linkId];
				if (oldLink) {
					if (!_.isEqual(newLink.attr || {}, (oldLink && oldLink.attr) || {})) {
						self.dispatchEvent('linkAttrChanged', newLink);
					}
				} else {
					self.dispatchEvent('linkCreated', newLink);
				}
			}
			for (linkId in currentLayout.links) {
				oldLink = currentLayout.links[linkId];
				newLink = newLayout.links && newLayout.links[linkId];
				if (!newLink) {
					self.dispatchEvent('linkRemoved', oldLink);
				}
			}
			currentLayout = newLayout;
			self.dispatchEvent('layoutChangeComplete');
			if (reposDetected && !loading && !isCurrentlyEdited) {
				content_change('editDone');
				loading = false;
			}
		},
		editNewIdea = function (newIdeaId) {
			self.setCurrentlyEdited(true);
			revertSelectionForUndo = currentlySelectedIdeaId;
			revertActivatedForUndo = activatedNodes.slice(0);
			self.selectNode(newIdeaId);
			self.editNode(false, true, true);
		},
		getCurrentlySelectedIdeaId = function () {
			return currentlySelectedIdeaId || idea.id;
		},
		onIdeaChanged = function (quickMode) {
			//revertSelectionForUndo = false;
			//revertActivatedForUndo = false;
			if (quickMode) {
				updateCurrentLayout(layoutCalculator(idea));
			} else {
				updateCurrentLayout(self.reactivate(layoutCalculator(idea)));
			}
		},
		currentlySelectedIdea = function () {
			return (idea.findSubIdeaById(currentlySelectedIdeaId) || idea);
		},
		ensureNodeIsExpanded = function (source, nodeId) {
			var node = idea.findSubIdeaById(nodeId) || idea;
			if (node.getAttr('collapsed')) {
				idea.updateAttr(nodeId, 'collapsed', false);
			}
		};
	observable(this);
	analytic = self.dispatchEvent.bind(self, 'analytic', 'mapModel');
	content_change = self.dispatchEvent.bind(self, 'content_change', 'mapModel');
	validationFn = self.dispatchEvent.bind(self, 'validationFn', 'mapModel');
	self.getIdea = function () {
		return idea;
	};
	self.isEditingEnabled = function () {
		return isEditingEnabled;
	};
	self.getCurrentLayout = function () {
		return currentLayout;
	};
	self.isLoading = function () {
		return loading;
	};
	self.setLoading = function (l) {
		loading = l;
	};
	self.analytic = analytic;
	self.getCurrentlySelectedIdeaId = getCurrentlySelectedIdeaId;
	this.setIdea = function (anIdea, quickMode) {
		loading = true;
		if (idea) {
			idea.removeEventListener('changed', onIdeaChanged);
			//self.dispatchEvent('nodeSelectionChanged', currentlySelectedIdeaId, false);
			//currentlySelectedIdeaId = undefined;
		}
		idea = anIdea;
		idea.addEventListener('changed', onIdeaChanged);
		onIdeaChanged(quickMode);
		self.selectNode(idea.id, true);
		//self.selectNode(currentlySelectedIdeaId, true);
		loading = false;
		//self.dispatchEvent('mapViewResetRequested');
	};
	this.setUid = function(uid) {
		this.uid = uid;
	};
	this.setEditOldEnabled = function(b) {
        isEditOldEnabled = b;
    };
    this.getIdea = function() {
        return idea;
    };
	this.setEditingEnabled = function (value) {
		isEditingEnabled = value;
	};
	this.getEditingEnabled = function () {
		return isEditingEnabled;
	};
	this.setInputEnabled = function (value) {
		if (isInputEnabled !== value) {
			isInputEnabled = value;
			self.dispatchEvent('inputEnabledChanged', value);
		}
	};
	this.getCurrentlyEdited = function() {
		return isCurrentlyEdited;
	};
	this.setCurrentlyEdited = function (v) {
		isCurrentlyEdited = v;
	}
	this.getInputEnabled = function () {
		return isInputEnabled;
	};
	this.selectNodeByOid = function (oid) {
		var node = self.findIdeaByOid(oid);
		var id = null;
		if (node) {
			id = node.id;
		}
		if (id) {
			self.selectNode(id, false);
		}
	};
	this.selectNode = function (id, force) {
		if (force || (isInputEnabled && (id !== currentlySelectedIdeaId || !self.isActivated(id)))) {
			if (currentlySelectedIdeaId) {
				self.dispatchEvent('nodeSelectionChanged', currentlySelectedIdeaId, false);
			}
			currentlySelectedIdeaId = id;
			self.dispatchEvent('nodeSelectionChanged', id, true);
		}
	};
	this.navigate = function (event) {
		var node = self.findIdeaById(currentlySelectedIdeaId);
		self.dispatchEvent('requestTree', node.oid);
	};
	this.previewNode = function (event) {
		var node = self.findIdeaById(currentlySelectedIdeaId);
		self.dispatchEvent('previewNode', node.oid);
	};
	this.clickNode = function (id, event) {
		var button = event && event.button;
		var node = self.findIdeaById(id);
		if (event && (event.metaKey)) {
			self.addLink('mouse', id);
		} else if (event && event.shiftKey) {
			/*don't stop propagation, this is needed for drop targets*/
			self.toggleActivationOnNode('mouse', id);
		} else if (isAddLinkMode && !button) {
			this.addLink('mouse', id);
			this.toggleAddLinkMode();
		} else {
			this.selectNode(id);
			if (isInputEnabled) {
				if (button) {
					self.dispatchEvent('contextMenuRequested', id, event.layerX, event.layerY);
				} else if (event) {
					if (node && node.oid) {
						if (event.ctrlKey) {
							self.dispatchEvent('navigateToNode', node.oid);
						} else if (event.altKey) {
							self.dispatchEvent('requestTree', node.oid);
						}
					}
				}
			} else {
				if (node && node.oid) {
					window.location = '/topic/' + node.oid;
				}
			}
		}
	};
	this.findIdeaById = function (id) {
		/*jslint eqeq:true */
		if (idea.id == id) {
			return idea;
		}
		return idea.findSubIdeaById(id);
	};
	this.findIdeaByOid = function (oid) {
		/*jslint eqeq:true */
		if (idea.oid == oid) {
			return idea;
		}
		return idea.findSubIdeaByOid(oid);
	};
	this.getSelectedStyle = function (prop) {
		return this.getStyleForId(currentlySelectedIdeaId, prop);
	};
	this.getStyleForId = function (id, prop) {
		var node = currentLayout.nodes && currentLayout.nodes[id];
		return node && node.attr && node.attr.style && node.attr.style[prop];
	};
	this.toggleCollapse = function (source) {
		var selectedIdea = currentlySelectedIdea(),
			isCollapsed;
		if (self.isActivated(selectedIdea.id) && _.size(selectedIdea.ideas) > 0) {
			isCollapsed = selectedIdea.getAttr('collapsed');
		} else {
			isCollapsed = self.everyActivatedIs(function (id) {
				var node = self.findIdeaById(id);
				if (node && _.size(node.ideas) > 0) {
					return node.getAttr('collapsed');
				}
				return true;
			});
		}
		this.collapse(source, !isCollapsed);
	};
	this.collapse = function (source, doCollapse) {
		analytic('collapse:' + doCollapse, source);
		var contextNodeId = getCurrentlySelectedIdeaId(),
			contextNode = function () {
				return contextNodeId && currentLayout && currentLayout.nodes && currentLayout.nodes[contextNodeId];
			},
			oldContext,
			newContext;
		oldContext = contextNode();
		if (isInputEnabled) {
			self.applyToActivated(function (id) {
				var node = self.findIdeaById(id);
				if (node && (!doCollapse || (node.ideas && _.size(node.ideas) > 0))) {
					idea.updateAttr(id, 'collapsed', doCollapse);
				}
			});
		}
		newContext = contextNode();
		if (oldContext && newContext) {
			moveNodes(
				currentLayout.nodes,
				oldContext.x - newContext.x,
				oldContext.y - newContext.y
			);
		}
		self.dispatchEvent('layoutChangeComplete');
	};
	this.updateStyle = function (source, prop, value) {
		/*jslint eqeq:true */
		if (!isEditingEnabled) {
			return false;
		}
		if (isInputEnabled) {
			analytic('updateStyle:' + prop, source);
			self.applyToActivated(function (id) {
				if (self.getStyleForId(id, prop) != value) {
					idea.mergeAttrProperty(id, 'style', prop, value);
				}
			});
		}
	};
	this.updateLinkStyle = function (source, ideaIdFrom, ideaIdTo, prop, value) {
		if (!isEditingEnabled) {
			return false;
		}
		if (isInputEnabled) {
			analytic('updateLinkStyle:' + prop, source);
			var merged = _.extend({}, idea.getLinkAttr(ideaIdFrom, ideaIdTo, 'style'));
			merged[prop] = value;
			idea.updateLinkAttr(ideaIdFrom, ideaIdTo, 'style', merged);
		}
	};
	this.addSubIdea = function (source, parentId) {
		if (!isEditingEnabled) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('edit') == -1) {
			return false;
		}
		var target = parentId || currentlySelectedIdeaId, newId;
		analytic('addSubIdea', source);
		if (isInputEnabled) {
			idea.batch(function () {
				ensureNodeIsExpanded(source, target);
				newId = idea.addSubIdea(target, getRandomTitle(titlesToRandomlyChooseFrom));
			});
			if (newId) {
				editNewIdea(newId);
			} else {
				content_change('addSubIdea', source);
			}
		}

	};
	this.insertIntermediate = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		if (!isInputEnabled || currentlySelectedIdeaId === idea.id) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('edit') == -1) {
			return false;
		}
		var activeNodes = [], newId;
		analytic('insertIntermediate', source);
		self.applyToActivated(function (i) { activeNodes.push(i); });
		newId = idea.insertIntermediateMultiple(activeNodes);
		if (newId) {
			editNewIdea(newId);
		} else {
			content_change('insertIntermediate', source);
		}
	};
	this.addSiblingIdea = function (source) {
		var newId, parent;
		if (!isEditingEnabled) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('edit') == -1) {
			return false;
		}
		analytic('addSiblingIdea', source);
		if (isInputEnabled) {
			parent = idea.findParent(currentlySelectedIdeaId) || idea;
			idea.batch(function () {
				ensureNodeIsExpanded(source, parent.id);
				newId = idea.addSubIdea(parent.id, getRandomTitle(titlesToRandomlyChooseFrom));
			});
			if (newId) {
				editNewIdea(newId);
			} else {
				content_change('addSiblingIdea', source);
			}
		}
	};
	this.removeSubIdea = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('removeSubIdea', source);
		if (isInputEnabled) {
			var shouldSelectParent,
				previousSelectionId = getCurrentlySelectedIdeaId(),
				parent = idea.findParent(previousSelectionId);
			self.applyToActivated(function (id) {
				var delIdea = self.findIdeaById(id);
				if (!delIdea) {
					return false;
				}
				var user_perms = delIdea.user_perms;
				if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('delete') == -1) {
					return false;
				} else {
					var removed  = idea.removeSubIdea(id);
					/*jslint eqeq: true*/
					if (previousSelectionId == id) {
						shouldSelectParent = removed;
					}
					content_change('removeSubIdea', delIdea);
				}
			});
			if (shouldSelectParent) {
				self.selectNode(parent.id);
			}
		}
	};
	this.updateTitle = function (ideaId, title, isNew) {
		if (isNew) {
			idea.initialiseTitle(ideaId, title);
		} else {
			idea.updateTitle(ideaId, title);
		}
	};
	this.editNode = function (source, shouldSelectAll, editingNew) {
		if (!isEditingEnabled) {
			isCurrentlyEdited = false;
			return false;
		}
		if (source) {
			analytic('editNode', source);
		}
		if (!isInputEnabled) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('edit') == -1) {
			return false;
		}
		var title = currentlySelectedIdea().title;
		if (title === 'Press Space or double-click to edit' || intermediaryTitlesToRandomlyChooseFrom.indexOf(title) !== -1 || titlesToRandomlyChooseFrom.indexOf(title) !== -1) {
			shouldSelectAll = true;
		}
		self.dispatchEvent('nodeEditRequested', currentlySelectedIdeaId, shouldSelectAll, !!editingNew);
	};
	this.editIcon = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		if (source) {
			analytic('editIcon', source);
		}
		if (!isInputEnabled) {
			return false;
		}
		self.dispatchEvent('nodeIconEditRequested', currentlySelectedIdeaId);
	};
	this.scaleUp = function (source) {
		self.scale(source, 1.25);
	};
	this.scaleDown = function (source) {
		self.scale(source, 0.8);
	};
	this.scale = function (source, scaleMultiplier, zoomPoint) {
		self.dispatchEvent('mapScaleChanged', scaleMultiplier, zoomPoint);
		analytic(scaleMultiplier < 1 ? 'scaleDown' : 'scaleUp', source);
	};
	this.move = function (source, deltaX, deltaY) {
		if (isInputEnabled) {
			self.dispatchEvent('mapMoveRequested', deltaX, deltaY);
			analytic('move', source);
		}
	};
	this.resetView = function (source) {
		//self.selectNode(idea.id);
		self.selectNode(currentlySelectedIdeaId || idea.id);
		self.dispatchEvent('mapViewResetRequested');
		analytic('resetView', source);
	};
	this.openAttachment = function (source, nodeId) {
		analytic('openAttachment', source);
		nodeId = nodeId || currentlySelectedIdeaId;
		var node = currentLayout.nodes[nodeId],
			attachment = node && node.attr && node.attr.attachment;
		if (node) {
			self.dispatchEvent('attachmentOpened', nodeId, attachment);
		}
	};
	this.openNode = function (source, nodeId) {
		analytic('openNode', source);
		nodeId = nodeId || currentlySelectedIdeaId;
		var node = self.findIdeaById(nodeId),
			oid = node ? node.oid : null;
		if (node) {
			self.dispatchEvent('navigateToNode', oid);
		}
	};
	this.setAttachment = function (source, nodeId, attachment) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('setAttachment', source);
		var hasAttachment = !!(attachment && attachment.content);
		idea.updateAttr(nodeId, 'attachment', hasAttachment && attachment);
		content_change('setAttachment', source);
	};
	this.addLink = function (source, nodeIdTo) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('addLink', source);
		idea.addLink(currentlySelectedIdeaId, nodeIdTo);
		content_change('addLink', source);
	};
	this.selectLink = function (source, link, selectionPoint) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('selectLink', source);
		if (!link) {
			return false;
		}
		self.dispatchEvent('linkSelected', link, selectionPoint, idea.getLinkAttr(link.ideaIdFrom, link.ideaIdTo, 'style'));
	};
	this.removeLink = function (source, nodeIdFrom, nodeIdTo) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('removeLink', source);
		idea.removeLink(nodeIdFrom, nodeIdTo);
		content_change('removeLink', source);
	};

	this.toggleAddLinkMode = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		if (!isInputEnabled) {
			return false;
		}
		analytic('toggleAddLinkMode', source);
		isAddLinkMode = !isAddLinkMode;
		self.dispatchEvent('addLinkModeToggled', isAddLinkMode);
	};
	this.cancelCurrentAction = function (source) {
		if (!isInputEnabled) {
			return false;
		}
		if (!isEditingEnabled) {
			return false;
		}
		if (isAddLinkMode) {
			this.toggleAddLinkMode(source);
		}
	};
	self.invalid_text = function (source, oldText) {
		validationFn({type: 'invalid_text', source: source, oldText: oldText});
	};
	self.undo = function (source) {
		if (!isEditingEnabled) {
			return false;
		}

		analytic('undo', source);
		var undoSelectionClone = revertSelectionForUndo,
			undoActivationClone = revertActivatedForUndo;
		if (isInputEnabled) {
			var ret = idea.undo();
			if ('removeSubIdea' == ret.eventMethod) {
				content_change('undo', self.findIdeaById(ret.eventArgs));
			}
			if (undoSelectionClone) {
				self.selectNode(undoSelectionClone);
			}
			if (undoActivationClone) {
				setActiveNodes(undoActivationClone);
			}

		}
	};
	self.redo = function (source) {
		if (!isEditingEnabled) {
			return false;
		}

		analytic('redo', source);
		if (isInputEnabled) {
			var ret = idea.redo();
			var newIdea = ret.eventArgs;
			if (newIdea) {
				if ('removeSubIdea' == ret.eventMethod) {
					content_change('redo', newIdea);
				}
			}
		}
	};
	self.moveRelative = function (source, relativeMovement) {
		if (!isEditingEnabled) {
			return false;
		}
		if (isInputEnabled) {
			idea.moveRelative(currentlySelectedIdeaId, relativeMovement);
			analytic('moveRelative', source);
		}
	};
	self.cut = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('delete') == -1) {
			return false;
		}
		analytic('cut', source);
		if (isInputEnabled) {
			var activeNodeIds = [], parents = [], firstLiveParent;
			self.applyToActivated(function (nodeId) {
				activeNodeIds.push(nodeId);
				parents.push(idea.findParent(nodeId).id);
			});
			self.clipBoard = idea.cloneMultiple(activeNodeIds);
			idea.removeMultiple(activeNodeIds);
			firstLiveParent = _.find(parents, idea.findSubIdeaById);
			self.selectNode(firstLiveParent || idea.id);
		}
	};
	self.copy = function (source) {
		var activeNodeIds = [];
		if (!isEditingEnabled) {
			return false;
		}
		analytic('copy', source);
		if (isInputEnabled) {
			self.applyToActivated(function (node) {
				activeNodeIds.push(node);
			});
			self.clipBoard = idea.cloneMultiple(activeNodeIds);
		}
	};
	self.paste = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('edit') == -1) {
			return false;
		}
		if (isInputEnabled) {
			var result = idea.pasteMultiple(currentlySelectedIdeaId, self.clipBoard);
			if (result && result[0]) {
				self.selectNode(result[0]);
			}
			analytic('paste', source);
			content_change('paste', source);
		}
	};
	self.pasteStyle = function (source) {
		if (!isEditingEnabled) {
			return false;
		}

		if (isInputEnabled && self.clipBoard && self.clipBoard[0]) {
			var pastingStyle = self.clipBoard[0].attr && self.clipBoard[0].attr.style;
			self.applyToActivated(function (id) {
				idea.updateAttr(id, 'style', pastingStyle);
			});
			analytic('pasteStyle', source);
			content_change('pasteStyle', source);
		}
	};
	self.getIcon = function (nodeId) {
		var node = currentLayout.nodes[nodeId || currentlySelectedIdeaId];
		if (!node) {
			return false;
		}
		return node.attr && node.attr.icon;
	};
	self.setIcon = function (source, url, imgWidth, imgHeight, position, nodeId) {
		if (!isEditingEnabled) {
			return false;
		}
		nodeId = nodeId || currentlySelectedIdeaId;
		var nodeIdea = self.findIdeaById(nodeId);
		if (!nodeIdea) {
			return false;
		}
		if (url) {
			idea.updateAttr(nodeId, 'icon', {
				url: url,
				width: imgWidth,
				height: imgHeight,
				position: position
			});
		} else if (nodeIdea.title || nodeId === idea.id) {
			idea.updateAttr(nodeId, 'icon', false);
		} else {
			idea.removeSubIdea(nodeId);
		}
		analytic('setIcon', source);
		content_change('setIcon', source);
	};
	self.moveUp = function (source) { self.moveRelative(source, -1); };
	self.moveDown = function (source) { self.moveRelative(source, 1); };
	self.getSelectedNodeId = function () {
		return getCurrentlySelectedIdeaId();
	};
	//node activation and selection
	(function () {
			var isRootOrRightHalf = function (id) {
				if (!id) {
					currentlySelectedIdeaId = id = idea.id;
				}
				return currentLayout.nodes[id].x >= currentLayout.nodes[idea.id].x;
			},
			isRootOrLeftHalf = function (id) {
				if (!id) {
					currentlySelectedIdeaId = id = idea.id;
				}
				return currentLayout.nodes[id].x <= currentLayout.nodes[idea.id].x;
			},
			nodesWithIDs = function () {
				return _.map(currentLayout.nodes,
					function (n, nodeId) {
						return _.extend({ id: parseInt(nodeId, 10)}, n);
					});
			},
			applyToNodeLeft = function (source, analyticTag, method) {
				var node,
					rank,
					isRoot = currentlySelectedIdeaId === idea.id,
					targetRank = isRoot ? -Infinity : Infinity;
				if (!isInputEnabled) {
					return;
				}
				analytic(analyticTag, source);
				if (isRootOrLeftHalf(currentlySelectedIdeaId)) {
					node = idea.id === currentlySelectedIdeaId ? idea : idea.findSubIdeaById(currentlySelectedIdeaId);
					ensureNodeIsExpanded(source, node.id);
					for (rank in node.ideas) {
						rank = parseFloat(rank);
						if ((isRoot && rank < 0 && rank > targetRank) || (!isRoot && rank > 0 && rank < targetRank)) {
							targetRank = rank;
						}
					}
					if (targetRank !== Infinity && targetRank !== -Infinity) {
						method.apply(self, [node.ideas[targetRank].id]);
					}
				} else {
					method.apply(self, [idea.findParent(currentlySelectedIdeaId).id]);
				}
			},
			applyToNodeRight = function (source, analyticTag, method) {
				var node, rank, minimumPositiveRank = Infinity;
				if (!isInputEnabled) {
					return;
				}
				analytic(analyticTag, source);
				if (isRootOrRightHalf(currentlySelectedIdeaId)) {
					node = idea.id === currentlySelectedIdeaId ? idea : idea.findSubIdeaById(currentlySelectedIdeaId);
					ensureNodeIsExpanded(source, node.id);
					for (rank in node.ideas) {
						rank = parseFloat(rank);
						if (rank > 0 && rank < minimumPositiveRank) {
							minimumPositiveRank = rank;
						}
					}
					if (minimumPositiveRank !== Infinity) {
						method.apply(self, [node.ideas[minimumPositiveRank].id]);
					}
				} else {
					method.apply(self, [idea.findParent(currentlySelectedIdeaId).id]);
				}
			},
			applyToNodeUp = function (source, analyticTag, method) {
				var previousSibling = idea.previousSiblingId(currentlySelectedIdeaId),
					nodesAbove,
					closestNode,
					currentNode = currentLayout.nodes[currentlySelectedIdeaId];
				if (!isInputEnabled) {
					return;
				}
				analytic(analyticTag, source);
				if (previousSibling) {
					method.apply(self, [previousSibling]);
				} else {
					if (!currentNode) { return; }
					nodesAbove = _.reject(nodesWithIDs(), function (node) {
						return node.y >= currentNode.y || Math.abs(node.x - currentNode.x) > horizontalSelectionThreshold;
					});
					if (_.size(nodesAbove) === 0) {
						return;
					}
					closestNode = _.min(nodesAbove, function (node) {
						return Math.pow(node.x - currentNode.x, 2) + Math.pow(node.y - currentNode.y, 2);
					});
					method.apply(self, [closestNode.id]);
				}
			},
			applyToNodeDown = function (source, analyticTag, method) {
				var nextSibling = idea.nextSiblingId(currentlySelectedIdeaId),
					nodesBelow,
					closestNode,
					currentNode = currentLayout.nodes[currentlySelectedIdeaId];
				if (!isInputEnabled) {
					return;
				}
				analytic(analyticTag, source);
				if (nextSibling) {
					method.apply(self, [nextSibling]);
				} else {
					if (!currentNode) { return; }
					nodesBelow = _.reject(nodesWithIDs(), function (node) {
						return node.y <= currentNode.y || Math.abs(node.x - currentNode.x) > horizontalSelectionThreshold;
					});
					if (_.size(nodesBelow) === 0) {
						return;
					}
					closestNode = _.min(nodesBelow, function (node) {
						return Math.pow(node.x - currentNode.x, 2) + Math.pow(node.y - currentNode.y, 2);
					});
					method.apply(self, [closestNode.id]);
				}
			},
			applyFuncs = { 'Left': applyToNodeLeft, 'Up': applyToNodeUp, 'Down': applyToNodeDown, 'Right': applyToNodeRight };
		self.activateSiblingNodes = function (source) {
			var parent = idea.findParent(currentlySelectedIdeaId),
				siblingIds;
			analytic('activateSiblingNodes', source);
			if (!parent || !parent.ideas) {
				return;
			}
			siblingIds = _.map(parent.ideas, function (child) { return child.id; });
			setActiveNodes(siblingIds);
		};
		self.activateNodeAndChildren = function (source) {
			analytic('activateNodeAndChildren', source);
			var contextId = getCurrentlySelectedIdeaId(),
				subtree = idea.getSubTreeIds(contextId);
			subtree.push(contextId);
			setActiveNodes(subtree);
		};
		_.each(['Left', 'Right', 'Up', 'Down'], function (position) {
			self['activateNode' + position] = function (source) {
				applyFuncs[position](source, 'activateNode' + position, function (nodeId) {
					self.activateNode(source, nodeId);
					currentlySelectedIdeaId = nodeId;
				});
			};
			self['selectNode' + position] = function (source) {
				applyFuncs[position](source, 'selectNode' + position, self.selectNode);
			};
		});
		self.toggleActivationOnNode = function (source, nodeId) {
			analytic('toggleActivated', source);
			if (!self.isActivated(nodeId)) {
				setActiveNodes([nodeId].concat(activatedNodes));
			} else {
				setActiveNodes(_.without(activatedNodes, nodeId));
			}
		};
		self.activateNode = function (source, nodeId) {
			analytic('activateNode', source);
			if (!self.isActivated(nodeId)) {
				activatedNodes.push(nodeId);
				self.dispatchEvent('activatedNodesChanged', [nodeId], []);
			}
		};
		self.activateChildren = function (source) {
			analytic('activateChildren', source);
			var context = currentlySelectedIdea();
			if (!context || _.isEmpty(context.ideas) || context.getAttr('collapsed')) {
				return;
			}
			setActiveNodes(idea.getSubTreeIds(context.id));
		};
		self.activateSelectedNode = function (source) {
			analytic('activateSelectedNode', source);
			setActiveNodes([getCurrentlySelectedIdeaId()]);
		};
		self.isActivated = function (id) {
			/*jslint eqeq:true*/
			return _.find(activatedNodes, function (activeId) { return id == activeId; });
		};
		self.applyToActivated = function (toApply) {
			idea.batch(function () {_.each(activatedNodes, toApply); });
		};
		self.everyActivatedIs = function (predicate) {
			return _.every(activatedNodes, predicate);
		};
		self.activateLevel = function (source, level) {
			analytic('activateLevel', source);
			var toActivate = _.map(
				_.filter(
					currentLayout.nodes,
					function (node) {
						/*jslint eqeq:true*/
						return node.level == level;
					}
				),
				function (node) {return node.id; }
			);
			if (!_.isEmpty(toActivate)) {
				setActiveNodes(toActivate);
			}
		};
		self.reactivate = function (layout) {
			_.each(layout.nodes, function (node) {
				if (_.contains(activatedNodes, node.id)) {
					node.activated = true;
				}
			});
			return layout;
		};
		self.addEventListener('nodeSelectionChanged', function (id, isSelected) {
			if (!isSelected) {
				setActiveNodes([]);
				return;
			}
			setActiveNodes([id]);
		}, 1);
	}());
};
