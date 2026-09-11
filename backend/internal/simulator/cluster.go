package simulator

import (
	"fmt"
	"sync"
	"time"
)

type NodeRole string
type NodeStatus string
type PodStatus string

const (
	RoleWorker       NodeRole = "worker"
	RoleControlPlane NodeRole = "control-plane"

	StatusReady    NodeStatus = "Ready"
	StatusNotReady NodeStatus = "NotReady"

	PodPending           PodStatus = "Pending"
	PodContainerCreating PodStatus = "ContainerCreating"
	PodRunning           PodStatus = "Running"
	PodFailed            PodStatus = "Failed"
)

type K8sNode struct {
	Name              string     `json:"name"`
	Role              NodeRole   `json:"role"`
	Status            NodeStatus `json:"status"`
	Health            int        `json:"health"`
	CPUCapacity       float64    `json:"cpuCapacity"`
	MemoryCapacity    int        `json:"memoryCapacity"` // in Mi
	CPUAllocatable    float64    `json:"cpuAllocatable"`
	MemoryAllocatable int        `json:"memoryAllocatable"`
	CPURequested      float64    `json:"cpuRequested"`
	MemoryRequested   int        `json:"memoryRequested"`
	Pods              []string   `json:"pods"`
	LaneIndex         int        `json:"laneIndex"`
	ServiceCapacity   int        `json:"serviceCapacity"`
}

type K8sPod struct {
	Name              string    `json:"name"`
	Image             string    `json:"image"`
	Status            PodStatus `json:"status"`
	Ready             bool      `json:"ready"`
	NodeName          string    `json:"nodeName"`
	CPURequest        float64   `json:"cpuRequest"`
	MemoryRequest     int       `json:"memoryRequest"`
	Age               int       `json:"age"`
	Restarts          int       `json:"restarts"`
	IP                string    `json:"ip"`
	Namespace         string    `json:"namespace"`
	CreationTimestamp int64     `json:"creationTimestamp"`
	LaneIndex         int       `json:"laneIndex"`
}

type ClusterEvent struct {
	ID          string `json:"id"`
	Timestamp   string `json:"timestamp"`
	TimeSeconds int    `json:"timeSeconds"`
	Type        string `json:"type"` // Normal, Warning
	Reason      string `json:"reason"`
	Object      string `json:"object"`
	Message     string `json:"message"`
	Step        string `json:"step,omitempty"`
	Details     string `json:"details,omitempty"`
}

type ClusterState struct {
	ClusterName       string         `json:"clusterName"`
	Namespace         string         `json:"namespace"`
	ContainerRuntime  string         `json:"containerRuntime"`
	PodCIDR           string         `json:"podCIDR"`
	Nodes             []K8sNode      `json:"nodes"`
	Pods              []K8sPod       `json:"pods"`
	Events            []ClusterEvent `json:"events"`
	Health            int            `json:"health"`
	Score             int            `json:"score"`
	SLAStreak         int            `json:"slaStreak"`
	MaxSLAStreak      int            `json:"maxSlaStreak"`
	RequestsCompleted int            `json:"requestsCompleted"`
	RequestsFailed    int            `json:"requestsFailed"`
}

type ClusterEngine struct {
	mu        sync.RWMutex
	state     ClusterState
	startTime time.Time
}

func NewClusterEngine(namespace string) *ClusterEngine {
	engine := &ClusterEngine{
		startTime: time.Now(),
		state: ClusterState{
			ClusterName:       "k8s.training.cluster.local",
			Namespace:         namespace,
			ContainerRuntime:  "containerd",
			PodCIDR:           "10.244.0.0/16",
			Nodes:             getDefaultNodes(),
			Pods:              make([]K8sPod, 0),
			Events:            make([]ClusterEvent, 0),
			Health:            100,
			Score:             0,
			SLAStreak:         0,
			MaxSLAStreak:      0,
			RequestsCompleted: 0,
			RequestsFailed:    0,
		},
	}
	engine.addInitialEvents()
	return engine
}

func getDefaultNodes() []K8sNode {
	return []K8sNode{
		{
			Name:              "worker-1",
			Role:              RoleWorker,
			Status:            StatusReady,
			Health:            100,
			CPUCapacity:       2.0,
			MemoryCapacity:    4096,
			CPUAllocatable:    1.8,
			MemoryAllocatable: 3584,
			CPURequested:      0,
			MemoryRequested:   0,
			Pods:              make([]string, 0),
			LaneIndex:         0,
			ServiceCapacity:   0,
		},
		{
			Name:              "worker-2",
			Role:              RoleWorker,
			Status:            StatusReady,
			Health:            100,
			CPUCapacity:       4.0,
			MemoryCapacity:    8192,
			CPUAllocatable:    3.8,
			MemoryAllocatable: 7680,
			CPURequested:      0,
			MemoryRequested:   0,
			Pods:              make([]string, 0),
			LaneIndex:         1,
			ServiceCapacity:   0,
		},
		{
			Name:              "worker-3",
			Role:              RoleWorker,
			Status:            StatusReady,
			Health:            100,
			CPUCapacity:       2.0,
			MemoryCapacity:    2048,
			CPUAllocatable:    1.8,
			MemoryAllocatable: 1792,
			CPURequested:      0,
			MemoryRequested:   0,
			Pods:              make([]string, 0),
			LaneIndex:         2,
			ServiceCapacity:   0,
		},
	}
}

func (c *ClusterEngine) addInitialEvents() {
	c.AddEvent(ClusterEvent{
		Type:    "Normal",
		Reason:  "NodeReady",
		Object:  "node/worker-1",
		Message: "Node worker-1 status is now: NodeReady (Allocatable: 1.8 CPU, 3.5Gi RAM)",
		Step:    "KUBELET_OBSERVED",
	})
	c.AddEvent(ClusterEvent{
		Type:    "Normal",
		Reason:  "NodeReady",
		Object:  "node/worker-2",
		Message: "Node worker-2 status is now: NodeReady (Allocatable: 3.8 CPU, 7.5Gi RAM)",
		Step:    "KUBELET_OBSERVED",
	})
	c.AddEvent(ClusterEvent{
		Type:    "Normal",
		Reason:  "NodeReady",
		Object:  "node/worker-3",
		Message: "Node worker-3 status is now: NodeReady (Allocatable: 1.8 CPU, 1.75Gi RAM)",
		Step:    "KUBELET_OBSERVED",
	})
}

func (c *ClusterEngine) GetState() ClusterState {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.state
}

func (c *ClusterEngine) AddEvent(evt ClusterEvent) {
	evt.ID = fmt.Sprintf("evt-%d", time.Now().UnixNano())
	evt.Timestamp = time.Now().Format("15:04:05")
	evt.TimeSeconds = int(time.Since(c.startTime).Seconds())

	c.state.Events = append([]ClusterEvent{evt}, c.state.Events...)
	if len(c.state.Events) > 50 {
		c.state.Events = c.state.Events[:50]
	}
}
