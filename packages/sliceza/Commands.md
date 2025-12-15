sliceza doctor

---

sliceza init

Purpose: bootstrap the system

What it does:
	•	creates slices.jsonc
	•	writes commented defaults
	•	safe to run multiple times (idempotent)

This is the entry point. Everything else builds on this.

---

sliceza list

Purpose: visibility of channels without mutation

What it shows:
	•	every slice with its channel name inline
	•	total number of slices

---

sliceza list channels

Purpose: visibility of channels without mutation

What it shows:
	•	channel names
	•	number of slices / files per channel

---

sliceza list <channel>

Purpose: visibility of slices within a channel

What it shows:
	•	slice names that are part of the channel

---

sliceza add <slice-name> path  --channel=color

---

sliceza remove <slice-name>

---

sliceza remove channel <channel>

---

sliceza build slice

---

sliceza build <channel>

(Channels cannot have the same name as slices)


